# Implementación Frontend

## Estructura de Archivos

```
frontend/
├── app/
│   └── (application)/
│       └── settings/
│           └── connections/
│               ├── page.tsx              # Página principal
│               └── components/
│                   ├── WhatsAppCard.tsx  # Card de cuenta conectada
│                   ├── QRModal.tsx       # Modal con código QR
│                   └── ConnectionStatus.tsx
├── hooks/
│   └── useWhatsApp.ts                    # Hook para Socket.IO
├── lib/
│   ├── socket.ts                         # Configuración Socket.IO
│   └── supabase.ts                       # Cliente Supabase
└── contexts/
    └── WhatsAppContext.tsx               # Context para estado global
```

---

## 1. Configuración Socket.IO

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const socket = getSocket();
  
  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
  
  return socket;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
```

---

## 2. Hook useWhatsApp

```typescript
// hooks/useWhatsApp.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { createClient } from '@/lib/supabase/client';

interface WhatsAppAccount {
  id: string;
  session_id: string;
  status: 'initializing' | 'ready' | 'error';
  phone_number: string | null;
  profile_name: string | null;
  name: string | null;
  connected_at: string | null;
  last_seen: string | null;
  error_message: string | null;
}

interface UseWhatsAppReturn {
  accounts: WhatsAppAccount[];
  loading: boolean;
  error: string | null;
  qrCode: string | null;
  connectingSessionId: string | null;
  connect: (name?: string) => Promise<void>;
  disconnect: (sessionId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWhatsApp(): UseWhatsAppReturn {
  const { user, session } = useAuth();
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectingSessionId, setConnectingSessionId] = useState<string | null>(null);
  
  const supabase = createClient();

  // Cargar cuentas
  const loadAccounts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Configurar Socket.IO
  useEffect(() => {
    if (!session?.access_token) return;

    const socket = connectSocket(session.access_token);

    // Eventos WhatsApp
    socket.on('whatsapp:qr', ({ sessionId, qr }) => {
      if (sessionId === connectingSessionId) {
        setQrCode(qr);
      }
    });

    socket.on('whatsapp:ready', ({ sessionId, phoneNumber }) => {
      setQrCode(null);
      setConnectingSessionId(null);
      loadAccounts();
    });

    socket.on('whatsapp:disconnected', ({ sessionId, reason }) => {
      loadAccounts();
    });

    socket.on('whatsapp:error', ({ sessionId, error, message }) => {
      setError(message || error);
      setQrCode(null);
      setConnectingSessionId(null);
      loadAccounts();
    });

    // Cargar cuentas iniciales
    loadAccounts();

    return () => {
      socket.off('whatsapp:qr');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:disconnected');
      socket.off('whatsapp:error');
    };
  }, [session?.access_token, connectingSessionId, loadAccounts]);

  // Conectar nueva cuenta
  const connect = useCallback(async (name?: string) => {
    if (!user) return;

    setError(null);
    setQrCode(null);

    try {
      // Crear registro en Supabase
      const sessionId = `user_${user.id}_wa_${crypto.randomUUID().slice(0, 8)}`;
      
      const { data: account, error } = await supabase
        .from('whatsapp_accounts')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          status: 'initializing',
          name: name || 'WhatsApp Principal'
        })
        .select()
        .single();
      
      if (error) throw error;

      setConnectingSessionId(sessionId);

      // Solicitar conexión al backend
      const socket = getSocket();
      socket.emit('whatsapp:create', {
        accountId: account.id,
        sessionId
      });

    } catch (err: any) {
      setError(err.message);
    }
  }, [user, supabase]);

  // Desconectar cuenta
  const disconnect = useCallback(async (sessionId: string) => {
    setError(null);

    try {
      const socket = getSocket();
      socket.emit('whatsapp:destroy', { sessionId });
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  return {
    accounts,
    loading,
    error,
    qrCode,
    connectingSessionId,
    connect,
    disconnect,
    refresh: loadAccounts
  };
}
```

---

## 3. Página de Conexiones

```tsx
// app/(application)/settings/connections/page.tsx
'use client';

import { useState } from 'react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { WhatsAppCard } from './components/WhatsAppCard';
import { QRModal } from './components/QRModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Plus, Loader2, AlertCircle } from 'lucide-react';

export default function ConnectionsPage() {
  const {
    accounts,
    loading,
    error,
    qrCode,
    connectingSessionId,
    connect,
    disconnect,
    refresh
  } = useWhatsApp();
  
  const [showQRModal, setShowQRModal] = useState(false);

  const handleConnect = async () => {
    setShowQRModal(true);
    await connect();
  };

  const handleDisconnect = async (sessionId: string) => {
    if (confirm('¿Estás seguro de que quieres desconectar esta cuenta?')) {
      await disconnect(sessionId);
    }
  };

  const connectedAccounts = accounts.filter(a => a.status === 'ready');
  const hasSlots = connectedAccounts.length < 3; // Límite de ejemplo

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conexiones</h1>
          <p className="text-muted-foreground">
            Gestiona tus cuentas de WhatsApp conectadas
          </p>
        </div>
        
        <Button
          onClick={handleConnect}
          disabled={!hasSlots || !!connectingSessionId}
        >
          {connectingSessionId ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Conectar WhatsApp
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de cuentas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No hay cuentas conectadas</CardTitle>
            <CardDescription className="text-center mb-4">
              Conecta tu WhatsApp para empezar a automatizar tus conversaciones
            </CardDescription>
            <Button onClick={handleConnect}>
              <Plus className="mr-2 h-4 w-4" />
              Conectar WhatsApp
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <WhatsAppCard
              key={account.id}
              account={account}
              onDisconnect={() => handleDisconnect(account.session_id)}
              onReconnect={() => connect()}
            />
          ))}
        </div>
      )}

      {/* Modal QR */}
      <QRModal
        open={showQRModal}
        qrCode={qrCode}
        onClose={() => {
          setShowQRModal(false);
        }}
      />
    </div>
  );
}
```

---

## 4. Componente WhatsAppCard

```tsx
// app/(application)/settings/connections/components/WhatsAppCard.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  MoreVertical, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WhatsAppAccount {
  id: string;
  session_id: string;
  status: 'initializing' | 'ready' | 'error';
  phone_number: string | null;
  profile_name: string | null;
  name: string | null;
  connected_at: string | null;
  last_seen: string | null;
  error_message: string | null;
}

interface WhatsAppCardProps {
  account: WhatsAppAccount;
  onDisconnect: () => void;
  onReconnect: () => void;
}

export function WhatsAppCard({ account, onDisconnect, onReconnect }: WhatsAppCardProps) {
  const statusConfig = {
    ready: {
      label: 'Conectado',
      icon: CheckCircle,
      variant: 'default' as const,
      color: 'text-green-500'
    },
    initializing: {
      label: 'Conectando',
      icon: Clock,
      variant: 'secondary' as const,
      color: 'text-yellow-500'
    },
    error: {
      label: 'Desconectado',
      icon: XCircle,
      variant: 'destructive' as const,
      color: 'text-red-500'
    }
  };

  const config = statusConfig[account.status];
  const StatusIcon = config.icon;

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return 'Sin número';
    return `+${phone.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smartphone className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">
              {account.name || 'WhatsApp'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatPhoneNumber(account.phone_number)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {account.status === 'error' && (
              <DropdownMenuItem onClick={onReconnect}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconectar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={onDisconnect}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Desconectar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            <Badge variant={config.variant} className="flex items-center gap-1">
              <StatusIcon className={`h-3 w-3 ${config.color}`} />
              {config.label}
            </Badge>
          </div>

          {/* Perfil */}
          {account.profile_name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Perfil</span>
              <span className="text-sm font-medium">{account.profile_name}</span>
            </div>
          )}

          {/* Última actividad */}
          {account.last_seen && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Última actividad</span>
              <span className="text-sm">
                {formatDistanceToNow(new Date(account.last_seen), {
                  addSuffix: true,
                  locale: es
                })}
              </span>
            </div>
          )}

          {/* Error */}
          {account.status === 'error' && account.error_message && (
            <div className="p-2 bg-red-50 rounded-md">
              <p className="text-xs text-red-600">{account.error_message}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5. Modal de QR

```tsx
// app/(application)/settings/connections/components/QRModal.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Smartphone, CheckCircle } from 'lucide-react';

interface QRModalProps {
  open: boolean;
  qrCode: string | null;
  onClose: () => void;
}

export function QRModal({ open, qrCode, onClose }: QRModalProps) {
  const [countdown, setCountdown] = useState(60);

  // Countdown para expiración del QR
  useEffect(() => {
    if (!open || !qrCode) {
      setCountdown(60);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, qrCode]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escanea el código QR con tu teléfono para conectar WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {qrCode ? (
            <>
              {/* QR Code */}
              <div className="p-4 bg-white rounded-lg shadow-sm border">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>

              {/* Countdown */}
              <p className="mt-4 text-sm text-muted-foreground">
                El código expira en {countdown} segundos
              </p>

              {/* Instrucciones */}
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">1</span>
                  Abre WhatsApp en tu teléfono
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">2</span>
                  Ve a Configuración → Dispositivos vinculados
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">3</span>
                  Escanea este código QR
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Loading */}
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                <p className="text-sm text-muted-foreground">
                  Generando código QR...
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. Context de WhatsApp (Opcional)

```tsx
// contexts/WhatsAppContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useWhatsApp } from '@/hooks/useWhatsApp';

type WhatsAppContextType = ReturnType<typeof useWhatsApp>;

const WhatsAppContext = createContext<WhatsAppContextType | null>(null);

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const whatsapp = useWhatsApp();

  return (
    <WhatsAppContext.Provider value={whatsapp}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsAppContext() {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsAppContext must be used within WhatsAppProvider');
  }
  return context;
}
```

---

## 7. Dependencias Frontend

```bash
npm install socket.io-client date-fns
```

---

## 8. Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

**Documento:** 06_IMPLEMENTACION_FRONTEND.md  
**Versión:** 2.0
