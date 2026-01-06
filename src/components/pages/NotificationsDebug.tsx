import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Copy, Loader2 } from 'lucide-react';

export function NotificationsDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
    setLogs((prev) => [...prev, `${timestamp} ${prefix} ${message}`]);
  };

  const testEnvironment = async () => {
    setTesting(true);
    setLogs([]);

    try {
      addLog('Starting notification system diagnostics...', 'info');

      // Check browser support
      addLog('Checking browser support...', 'info');
      const hasNotification = 'Notification' in window;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;

      addLog(`Notification API: ${hasNotification ? 'Available' : 'Not available'}`, hasNotification ? 'success' : 'error');
      addLog(`Service Worker API: ${hasServiceWorker ? 'Available' : 'Not available'}`, hasServiceWorker ? 'success' : 'error');
      addLog(`Push Manager API: ${hasPushManager ? 'Available' : 'Not available'}`, hasPushManager ? 'success' : 'error');

      if (!hasNotification || !hasServiceWorker || !hasPushManager) {
        addLog('Your browser does not support push notifications', 'error');
        setTesting(false);
        return;
      }

      // Check notification permission
      addLog('Checking notification permission...', 'info');
      const permission = Notification.permission;
      addLog(`Current permission: ${permission}`, permission === 'granted' ? 'success' : 'warn');

      // Check environment variables
      addLog('Checking environment variables...', 'info');
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (vapidKey) {
        addLog(`VITE_VAPID_PUBLIC_KEY found (length: ${vapidKey.length})`, 'success');
        addLog(`Key preview: ${vapidKey.substring(0, 20)}...`, 'info');
      } else {
        addLog('VITE_VAPID_PUBLIC_KEY not found in environment', 'error');
        addLog('Check your .env or .env.local file', 'warn');
      }

      // Check service worker registration
      addLog('Attempting service worker registration...', 'info');
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        addLog('Service worker registered successfully', 'success');
        addLog(`Scope: ${registration.scope}`, 'info');

        // Check push subscription
        addLog('Checking push subscriptions...', 'info');
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          addLog('User has active push subscription', 'success');
        } else {
          addLog('No active push subscription found', 'warn');
        }
      } catch (swError) {
        addLog(`Service worker registration failed: ${swError instanceof Error ? swError.message : String(swError)}`, 'error');
      }

      addLog('Diagnostics complete!', 'success');
    } catch (error) {
      addLog(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🔔 Push Notifications Debug</CardTitle>
          <CardDescription>Diagnose push notification setup issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testEnvironment} disabled={testing} className="w-full">
            {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Run Diagnostics
          </Button>

          {logs.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Diagnostic Results:</h3>
              <div className="bg-secondary p-4 rounded-lg font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-muted-foreground hover:text-foreground transition-colors">
                    {log}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(logs.join('\n'));
                  alert('Logs copied to clipboard');
                }}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Logs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">1. VAPID Keys Generated</p>
              <p className="text-xs text-muted-foreground">Run: node generate-vapid-keys.js</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">2. Public Key in .env</p>
              <p className="text-xs text-muted-foreground">VITE_VAPID_PUBLIC_KEY=your_key</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">3. Private Key in Supabase</p>
              <p className="text-xs text-muted-foreground">Settings → Secrets → VAPID_PRIVATE_KEY</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">4. Database Migration Run</p>
              <p className="text-xs text-muted-foreground">Copy notification_queue_setup.sql to Supabase</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">5. Dev Server Restarted</p>
              <p className="text-xs text-muted-foreground">npm run dev after .env changes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-sm">6. Browser Allows Notifications</p>
              <p className="text-xs text-muted-foreground">Check browser settings and allow localhost</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">VAPID key not found</p>
            <p className="text-muted-foreground text-xs">✓ Ensure .env file has VITE_VAPID_PUBLIC_KEY</p>
            <p className="text-muted-foreground text-xs">✓ Restart dev server after adding to .env</p>
            <p className="text-muted-foreground text-xs">✓ No spaces around the = sign</p>
          </div>

          <div>
            <p className="font-medium mb-1">Service worker fails to load</p>
            <p className="text-muted-foreground text-xs">✓ Check public/sw.js exists</p>
            <p className="text-muted-foreground text-xs">✓ Check DevTools → Application → Service Workers</p>
            <p className="text-muted-foreground text-xs">✓ Clear browser cache if stuck</p>
          </div>

          <div>
            <p className="font-medium mb-1">Permission dialog doesn't appear</p>
            <p className="text-muted-foreground text-xs">✓ Check browser notification settings</p>
            <p className="text-muted-foreground text-xs">✓ May need to allow notifications for localhost</p>
            <p className="text-muted-foreground text-xs">✓ Check browser console for errors</p>
          </div>

          <div>
            <p className="font-medium mb-1">Push subscription fails</p>
            <p className="text-muted-foreground text-xs">✓ VAPID key must be base64url encoded correctly</p>
            <p className="text-muted-foreground text-xs">✓ Regenerate keys with: node generate-vapid-keys.js</p>
            <p className="text-muted-foreground text-xs">✓ Check browser console for VAPID key errors</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Browser Console</CardTitle>
          <CardDescription>Check for detailed error messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">Open browser DevTools (F12) and check Console tab for error messages starting with ❌</p>
          <p className="text-muted-foreground">Copy any error messages and include in bug reports</p>
          <p className="text-muted-foreground">Look for messages about VAPID keys, service workers, or permissions</p>
        </CardContent>
      </Card>
    </div>
  );
}
