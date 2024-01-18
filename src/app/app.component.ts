import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { P2pService } from './p2p.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title= 'p2p-whiteboard';
  peerId: string = '';
  otherPeerId: string = '';
  private peerIdSubscription!: Subscription;

  constructor(private p2pService: P2pService) {}

  ngOnInit() {
    this.peerIdSubscription = this.p2pService.peerId$.subscribe((id) => {
      if (id) {
        this.peerId = id;
      }
    });
  }

  ngOnDestroy() {
    if (this.peerIdSubscription) {
      this.peerIdSubscription.unsubscribe();
    }
  }
  connectToOtherPeer() {
    if (this.otherPeerId) {
      this.p2pService.connectToPeer(this.otherPeerId).then(() => {
        console.log(`Connected to ${this.otherPeerId}`);
      }).catch(err => {
        console.error(`Error connecting to ${this.otherPeerId}:`, err);
      });
    }
  }
}
