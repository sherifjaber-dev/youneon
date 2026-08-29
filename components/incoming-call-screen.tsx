"use client";

import { useEffect } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { NeonAvatar } from "@/components/neon-avatar";
import {
  startCallRingtone,
  stopCallRingtone,
  type DirectCallInvite,
} from "@/lib/direct-call";

export function IncomingCallScreen({
  invite,
  onAccept,
  onDecline,
}: {
  invite: DirectCallInvite;
  onAccept: () => void;
  onDecline: () => void;
}) {
  useEffect(() => {
    const stop = startCallRingtone(true);
    return () => stop();
  }, [invite.id]);

  useEffect(() => () => stopCallRingtone(), []);

  return (
    <div className="yn-incoming" role="dialog" aria-label="Incoming video call" data-testid="incoming-call">
      <div className="yn-incoming-glow" aria-hidden />
      <p className="yn-incoming-kicker">Incoming video call</p>
      <NeonAvatar
        className="yn-incoming-avatar"
        src={invite.callerPhoto}
        name={invite.callerName}
        size={112}
        showPhoto
      />
      <h1 className="yn-incoming-name">{invite.callerName}</h1>
      <p className="yn-incoming-sub">is calling you</p>
      <div className="yn-incoming-actions">
        <button type="button" className="yn-incoming-btn is-decline" onClick={onDecline} data-testid="incoming-decline">
          <PhoneOff size={26} strokeWidth={2.2} />
          <span>Decline</span>
        </button>
        <button type="button" className="yn-incoming-btn is-accept" onClick={onAccept} data-testid="incoming-accept">
          <Phone size={26} strokeWidth={2.2} />
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
}
