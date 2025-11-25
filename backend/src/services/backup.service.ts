import * as cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { supabaseAdmin } from '../config/supabase';
import { env } from '../config/environment';

/**
 * Automated Backup Service for WhatsApp Sessions
 * 
 * - Daily automated backups at 2 AM
 * - Compression using gzip
 * - 30-day retention policy
 * - Supabase Storage for cloud backup
 * - Restore functionality for disaster recovery
 */

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  duration?: number;
  error?: string;
}

class BackupService {
  private sessionsPath: string;
  private backupBucket: string = 'whatsapp-backups';
  private retentionDays: number = 30;
  private isBackupRunning: boolean = false;
  private cronJob?: cron.ScheduledTask;

  constructor() {
    this.sessionsPath = env.sessionsPath || '/app/whatsapp-sessions';
    console.log('📦 BackupService initialized', {
      sessionsPath: this.sessionsPath,
      backupBucket: this.backupBucket,
      retentionDays: this.retentionDays
    });
  }

  /**
   * Start automated backup schedule - Daily at 2:00 AM
   */
  start(): void {
    if (this.cronJob) {
      console.log('⚠️ Automated backups already running');
      return;
    }

    // Schedule backup every day at 2:00 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Automated backup triggered at 2:00 AM');
      
      try {
        const result = await this.createFullBackup();
        
        if (result.success) {
          console.log('✅ Automated backup completed', {
            filename: result.filename,
            size: result.size,
            duration: result.duration
          });
        } else {
          console.error('❌ Automated backup failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Automated backup error:', error);
      }
    });

    console.log('✅ Automated backups scheduled (daily at 2:00 AM)');
  }

  /**
   * Stop automated backups
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      console.log('🛑 Automated backups stopped');
    }
  }

  /**
   * Create backup for all active sessions
   */
  async createFullBackup(): Promise<BackupResult> {
    if (this.isBackupRunning) {
      console.log('⚠️ Backup already in progress, skipping');
      return { success: false, error: 'Backup already in progress' };
    }

    this.isBackupRunning = true;
    const startTime = Date.now();

    try {
      console.log('📦 Starting session backups...');

      // Get all active sessions from database
      const { data: activeSessions, error: dbError } = await supabaseAdmin
        .from('whatsapp_accounts')
        .select('id, session_id, phone_number, status')
        .eq('status', 'ready');

      if (dbError) {
        throw new Error(`Failed to fetch active sessions: ${dbError.message}`);
      }

      if (!activeSessions || activeSessions.length === 0) {
        console.log('📦 No active sessions to backup');
        return { success: true, filename: 'no-active-sessions', size: 0, duration: Date.now() - startTime };
      }

      console.log(`📦 Found ${activeSessions.length} active session(s) to backup`);

      let successCount = 0;
      let failCount = 0;
      let totalSize = 0;

      // Backup each session individually
      for (const session of activeSessions) {
        try {
          const result = await this.backupSingleSession(session.session_id);
          
          if (result.success) {
            successCount++;
            totalSize += result.size || 0;
            console.log(`✅ Backed up: ${session.session_id}`);
          } else {
            failCount++;
            console.error(`❌ Failed: ${session.session_id} - ${result.error}`);
          }
        } catch (error) {
          failCount++;
          console.error(`❌ Exception backing up ${session.session_id}:`, error);
        }
      }

      // Cleanup old backups
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;

      console.log('📦 Backup completed', {
        total: activeSessions.length,
        success: successCount,
        failed: failCount,
        totalSize,
        duration
      });

      return {
        success: failCount === 0,
        filename: `${successCount}/${activeSessions.length} sessions backed up`,
        size: totalSize,
        duration,
        error: failCount > 0 ? `${failCount} session(s) failed` : undefined
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('❌ Full backup failed:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        duration
      };
    } finally {
      this.isBackupRunning = false;
    }
  }

  /**
   * Backup a single WhatsApp session
   */
  private async backupSingleSession(sessionId: string): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `session-${sessionId}-${timestamp}.tar.gz`;
    const tempPath = path.join('/tmp', filename);
    const sessionPath = path.join(this.sessionsPath, `session-${sessionId}`);

    try {
      // Check if session directory exists
      if (!fs.existsSync(sessionPath)) {
        return { success: false, error: 'Session directory not found' };
      }

      // Create tar.gz archive
      await tar.create(
        {
          gzip: true,
          file: tempPath,
          cwd: this.sessionsPath,
        },
        [`session-${sessionId}`]
      );

      // Get file size
      const stats = fs.statSync(tempPath);
      const fileSize = stats.size;

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(tempPath);
      
      const { error } = await supabaseAdmin.storage
        .from(this.backupBucket)
        .upload(`sessions/${filename}`, fileBuffer, {
          contentType: 'application/gzip',
          upsert: false
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Clean up temp file
      fs.unlinkSync(tempPath);

      return {
        success: true,
        filename,
        size: fileSize,
        duration: Date.now() - startTime
      };

    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Clean up old backups (older than retention period)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      console.log('🧹 Cleaning up old backups...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      const { data: files, error } = await supabaseAdmin.storage
        .from(this.backupBucket)
        .list('sessions', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        console.error('Failed to list backups for cleanup:', error.message);
        return;
      }

      const oldFiles = files?.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < cutoffDate;
      }) || [];

      if (oldFiles.length === 0) {
        console.log('🧹 No old backups to delete');
        return;
      }

      for (const file of oldFiles) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from(this.backupBucket)
          .remove([`sessions/${file.name}`]);

        if (deleteError) {
          console.error(`Failed to delete ${file.name}:`, deleteError.message);
        } else {
          console.log(`🗑️ Deleted old backup: ${file.name}`);
        }
      }

      console.log(`🧹 Cleanup completed: ${oldFiles.length} old backups deleted`);

    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  /**
   * Restore sessions from the most recent backup
   */
  async restoreFromBackup(sessionId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Starting session restoration from backup...');

      // List backups
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from(this.backupBucket)
        .list('sessions', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        throw new Error(`Failed to list backups: ${listError.message}`);
      }

      if (!files || files.length === 0) {
        return { success: false, error: 'No backups available' };
      }

      // Find the right backup
      let backupFile = files[0]; // Most recent by default
      
      if (sessionId) {
        const sessionBackup = files.find(f => f.name.includes(sessionId));
        if (sessionBackup) {
          backupFile = sessionBackup;
        } else {
          return { success: false, error: `No backup found for session ${sessionId}` };
        }
      }

      console.log(`📦 Restoring from: ${backupFile.name}`);

      // Download backup
      const { data, error: downloadError } = await supabaseAdmin.storage
        .from(this.backupBucket)
        .download(`sessions/${backupFile.name}`);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const tempPath = path.join('/tmp', backupFile.name);
      
      fs.writeFileSync(tempPath, buffer);

      // Extract backup
      await tar.extract({
        file: tempPath,
        cwd: this.sessionsPath,
      });

      // Clean up
      fs.unlinkSync(tempPath);

      console.log('✅ Session restored successfully');
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Restore failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<{ filename: string; size: number; created_at: string }[]> {
    try {
      const { data: files, error } = await supabaseAdmin.storage
        .from(this.backupBucket)
        .list('sessions', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Failed to list backups:', error.message);
        return [];
      }

      return files?.map(f => ({
        filename: f.name,
        size: f.metadata?.size || 0,
        created_at: f.created_at
      })) || [];

    } catch (error) {
      console.error('List backups error:', error);
      return [];
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: !!this.cronJob,
      isBackupInProgress: this.isBackupRunning,
      sessionsPath: this.sessionsPath,
      backupBucket: this.backupBucket,
      retentionDays: this.retentionDays,
      schedule: 'Daily at 2:00 AM'
    };
  }
}

export const backupService = new BackupService();
