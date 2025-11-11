"use client";

import { useState } from "react";
import { CommunityNotificationChannel } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface NotificationPreferencesProps {
  channels: CommunityNotificationChannel[];
  communityName: string;
}

export function NotificationPreferences({ channels, communityName }: NotificationPreferencesProps) {
  const [state, setState] = useState(channels);

  const toggle = (channel: CommunityNotificationChannel["channel"]) => {
    setState(prev =>
      prev.map(item =>
        item.channel === channel
          ? { ...item, enabled: !item.enabled, lastTriggeredAt: item.enabled ? item.lastTriggeredAt : new Date().toISOString() }
          : item
      )
    );
  };

  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-700">Notificaciones push & alertas</h3>
        <p className="text-xs text-neutral-500">
          Sincroniza campañas de {communityName} con centros de notificaciones push, email o Slack.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {state.map(channel => (
          <div key={channel.channel} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium capitalize">{channel.channel}</div>
              <Badge color={channel.enabled ? "green" : "neutral"}>{channel.enabled ? "Activo" : "Inactivo"}</Badge>
            </div>
            <div className="mt-2 text-xs text-neutral-500 space-y-1">
              {channel.lastTriggeredAt ? (
                <div>Último envío: {new Date(channel.lastTriggeredAt).toLocaleString()}</div>
              ) : (
                <div>Aún sin envíos</div>
              )}
              <Button size="sm" variant="secondary" onClick={() => toggle(channel.channel)}>
                {channel.enabled ? "Pausar" : "Activar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
