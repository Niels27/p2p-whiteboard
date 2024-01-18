import { Injectable } from '@angular/core';
import { Peer, DataConnection } from 'peerjs'; 
import { Subject,BehaviorSubject  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class P2pService {
  private peer: Peer;
  private connections: Map<string, DataConnection> = new Map();
  private peerIdSubject: BehaviorSubject<string|null> = new BehaviorSubject<string|null>(null);
  public peerId$ = this.peerIdSubject.asObservable(); // Public observable for components to subscribe
  private dataSubject: Subject<any> = new Subject<any>(); 

  constructor() {
    // Initialize PeerJS
    this.peer = new Peer();

    this.peer.on('open', (id) => {
      this.peerIdSubject.next(id); // Emit the peer ID when it's ready
      console.log(`My peer ID is: ${id}`);
    });

    // Listen for incoming connections
    this.peer.on('connection', (conn) => {
      this.addConnection(conn.peer, conn);
      conn.on('data', (data) => {
        // Handle received drawing data
        this.processReceivedData(data);
      });
    });
  }

  private addConnection(peerId: string, conn: DataConnection) {
    this.connections.set(peerId, conn);
  }

  connectToPeer(peerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connections.has(peerId)) {
        return resolve(); // Already connected
      }
      
      const conn = this.peer.connect(peerId);

      conn.on('open', () => {
        this.addConnection(peerId, conn);
        console.log(`Connected to: ${peerId}`);
        resolve();
      });

      conn.on('error', (err) => {
        console.error(`Connection to ${peerId} failed:`, err);
        reject(err);
      });

      // Handle receiving data
      conn.on('data', (data) => {
        this.processReceivedData(data);
      });
    });
  }

  sendDrawingData(data: any) {
    // Send data to all connected peers
    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        conn.send(data);
      } else {
        console.log(`Connection to ${peerId} is not open.`);
      }
    });

  }
  // Components can subscribe to this method to get updates
  getDataUpdates() {
    return this.dataSubject.asObservable();
  }
  private processReceivedData(data: any) {
    // Pass the data to all subscribers
    this.dataSubject.next(data);
  }

}
