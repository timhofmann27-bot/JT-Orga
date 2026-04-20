import { getFirebaseAdmin } from '../lib/firebaseAdmin';
import { db } from '../db';

export async function sendPushNotification(userType: 'admin' | 'person', userId: number, payload: { title: string; body: string; data?: Record<string, string> }) {
  const admin = getFirebaseAdmin();
  
  // Get all tokens for this user
  const tokens = db.prepare('SELECT token FROM fcm_tokens WHERE user_type = ? AND user_id = ?').all(userType, userId) as { token: string }[];
  
  if (tokens.length === 0) return;

  const registrationTokens = tokens.map(t => t.token);
  
  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
    tokens: registrationTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Cleanup invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
            tokensToRemove.push(registrationTokens[idx]);
          }
        }
      });
      
      if (tokensToRemove.length > 0) {
        const placeholders = tokensToRemove.map(() => '?').join(',');
        db.prepare(`DELETE FROM fcm_tokens WHERE token IN (${placeholders})`).run(...tokensToRemove);
      }
    }
    
    console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} errors.`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function notifyEventUpdate(eventId: number, changes: string[]) {
  const event = db.prepare('SELECT title FROM events WHERE id = ?').get(eventId) as { title: string } | undefined;
  if (!event) return;

  const invitees = db.prepare(`
    SELECT p.id, p.name, i.person_id 
    FROM invitees i 
    JOIN persons p ON i.person_id = p.id 
    WHERE i.event_id = ? AND i.status IN ('yes', 'maybe', 'pending')
  `).all(eventId) as { id: number; name: string }[];

  const title = `Update: ${event.title}`;
  const body = changes.join(', ');

  for (const invitee of invitees) {
    await sendPushNotification('person', invitee.id, {
      title,
      body,
      data: {
        eventId: eventId.toString(),
        type: 'event_update'
      }
    });
  }
}

export async function notifyNewMessage(eventId: number, senderPersonId: number, message: string) {
  const event = db.prepare('SELECT title FROM events WHERE id = ?').get(eventId) as { title: string } | undefined;
  const sender = db.prepare('SELECT name FROM persons WHERE id = ?').get(senderPersonId) as { name: string } | undefined;
  if (!event || !sender) return;

  const title = `${sender.name} in ${event.title}`;
  const body = message.length > 100 ? message.substring(0, 97) + '...' : message;

  const invitees = db.prepare(`
    SELECT p.id 
    FROM invitees i 
    JOIN persons p ON i.person_id = p.id 
    WHERE i.event_id = ? AND i.person_id != ? AND i.status IN ('yes', 'maybe')
  `).all(eventId, senderPersonId) as { id: number }[];

  for (const invitee of invitees) {
    await sendPushNotification('person', invitee.id, {
      title,
      body,
      data: {
        eventId: eventId.toString(),
        type: 'new_message'
      }
    });
  }
}

export async function sendBroadcastNotification(payload: { title: string; body: string; data?: Record<string, string> }) {
  const admin = getFirebaseAdmin();
  
  // Get all unique tokens across all persons
  const tokens = db.prepare("SELECT DISTINCT token FROM fcm_tokens WHERE user_type = 'person'").all() as { token: string }[];
  
  if (tokens.length === 0) return;

  const registrationTokens = tokens.map(t => t.token);
  
  // Multicast has a limit of 500 tokens per call
  const chunkSize = 500;
  for (let i = 0; i < registrationTokens.length; i += chunkSize) {
    const chunk = registrationTokens.slice(i, i + chunkSize);
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      tokens: chunk,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Cleanup invalid tokens
      if (response.failureCount > 0) {
        const tokensToRemove: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
              tokensToRemove.push(chunk[idx]);
            }
          }
        });
        
        if (tokensToRemove.length > 0) {
          const placeholders = tokensToRemove.map(() => '?').join(',');
          db.prepare(`DELETE FROM fcm_tokens WHERE token IN (${placeholders})`).run(...tokensToRemove);
        }
      }
      console.log(`Broadcast chunk sent: ${response.successCount} success, ${response.failureCount} failed.`);
    } catch (error) {
      console.error('Error sending broadcast chunk:', error);
    }
  }
}
