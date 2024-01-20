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
  public peerId$ = this.peerIdSubject.asObservable(); //Public observable for components to subscribe to
  private dataSubject: Subject<any> = new Subject<any>(); 

  constructor() {
    //Initializes PeerJS
    this.peer = new Peer();
  
    this.peer.on('open', (id) => {
      this.peerIdSubject.next(id); //Emits the peer ID once it's ready
      console.log(`My peer ID is: ${id}`);
    });
  
    //Listen for incoming connections
    this.peer.on('connection', (conn) => {
      this.addConnection(conn.peer, conn);
      conn.on('data', (data: any) => { 
        if (data.type === 'image') {
          console.log("Image data Received", data);
          this.notifyImageReceived(data);
        } else {
          //Handle other types of  data
          console.log("Data Received", data);
          this.processReceivedData(data);
        }
      });
    });
  }
  //Components can subscribe to this method to get updates
  private imageReceivedSubject = new Subject<any>();
  public imageReceived$ = this.imageReceivedSubject.asObservable();
  
  private notifyImageReceived(imageData: any) {
    this.imageReceivedSubject.next(imageData);
  }
  
  private addConnection(peerId: string, conn: DataConnection) {
    this.connections.set(peerId, conn);
  }

  connectToPeer(peerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connections.has(peerId)) {
        return resolve(); //if Already connected
      }
      
      const conn = this.peer.connect(peerId);

      conn.on('open', () => {
        this.addConnection(peerId, conn);
        console.log(`Connected to: ${peerId}`);
    
        //Send a reciprocal connection request back to the peer
        if (!this.connections.has(peerId)) {
          this.peer.connect(peerId); //triggers the peer.on('connection') on the other peer
        }
    
        resolve();
      });

      conn.on('error', (err) => {
        console.error(`Connection to ${peerId} failed:`, err);
        reject(err);
      });

      //Handle receiving data
      conn.on('data', (data: any) => {
        if (data.type === 'image') {
          console.log("Image data Received", data);
          this.notifyImageReceived(data);
        } else {
          //Handle other types of received data
          console.log("Data Received", data);
          this.processReceivedData(data);
        }
      });
    });
  }


  //Method to send any data to all connected peers
  sendDataToPeer(data: any) {
    const testData = { message: "Test message" };
    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        console.log("Data send: ", data);
        //conn.send(testData);
        conn.send(data);
      } else {
        console.log(`Connection to ${peerId} is not open.`);
      }
    });
  }

  sendDrawingData(data: any) {
    //Send data to all connected peers
    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        conn.send(data);
      } else {
        console.log(`Connection to ${peerId} is not open.`);
      }
    });

  }
  //Components can subscribe to this method to get updates
  getDataUpdates() {
    return this.dataSubject.asObservable();
  }
  private processReceivedData(data: any) {
    console.log("Processing received data: ", data);
    //Pass the data to all subscribers
    this.dataSubject.next(data);
  }

}