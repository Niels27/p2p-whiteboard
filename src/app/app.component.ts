import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { P2pService } from './p2p.service';
import { ViewChild } from '@angular/core';
import { WhiteboardComponent } from './whiteboard/whiteboard.component'; // Import the WhiteboardComponent class

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(WhiteboardComponent) whiteboardComponent!: WhiteboardComponent;

  title= 'p2p-whiteboard';
  peerId: string = '';
  otherPeerId: string = '';
  currentColor: string = 'black';
  currentBrushSize: number = 5;

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

  changeColor(newColor: string) {
    this.currentColor = newColor;
  }

  changeBrushSize(newSize: number) {
    this.currentBrushSize = newSize;
  }

  clearCanvas() {
    console.log("Clear Canvas Method Called"); 
    this.whiteboardComponent.clearCanvas();

  }
  
}

