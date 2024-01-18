import { Injectable } from '@angular/core';
import Peer from 'peerjs';


@Injectable({
  providedIn: 'root'
})
export class P2pService {
  private peer: Peer;
  private connections: Map<string, Peer.DataConnection> = new Map();
  public peerId: string = '';

  constructor() {
    // Initialize PeerJS
    this.peer = new Peer();

    this.peer.on('open', (id) => {
      this.peerId = id;
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

  private addConnection(peerId: string, conn: Peer.DataConnection) {
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

  private processReceivedData(data: any) {
    // This method should pass the data to the components that need it
    // For example, you can use an Observable to allow components to subscribe to incoming data
  }

  // Other service methods...
}
