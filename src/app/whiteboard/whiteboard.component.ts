import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HostListener } from '@angular/core';
import { P2pService } from '../p2p.service'; 

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.css']
})
export class WhiteboardComponent implements AfterViewInit {
  @ViewChild('whiteboardCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;

  constructor(private p2pService: P2pService) {}

  ngAfterViewInit(): void {
    const context = this.canvas.nativeElement.getContext('2d');
    if (context) {
      this.ctx = context;
    } else {
      // Handle the error when the context is not available
      console.error('Could not get canvas context');
    }
    this.resizeCanvas();
    this.addEventListeners();
  }

  @HostListener('window:resize', ['$event'])
  resizeCanvas() {
    const canvasEl = this.canvas.nativeElement;
    canvasEl.width = canvasEl.offsetWidth; // Set canvas internal width to match CSS width
    canvasEl.height = canvasEl.offsetHeight; // Set canvas internal height to match CSS height
  }

  private addEventListeners() {
    const canvasEl = this.canvas.nativeElement;

    canvasEl.addEventListener('mousedown', this.startDrawing.bind(this));
    canvasEl.addEventListener('mousemove', this.draw.bind(this));
    canvasEl.addEventListener('mouseup', this.stopDrawing.bind(this));
    canvasEl.addEventListener('mouseleave', this.stopDrawing.bind(this));
  }

  private startDrawing(event: MouseEvent) {
    this.drawing = true;
    this.draw(event);
  }

  private draw(event: MouseEvent) {
    if (!this.drawing) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this.ctx.lineWidth = 4; // You can make this dynamic
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = 'black'; // Also can be dynamic

    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    // Prepare the data to be sent
    const data = { /* ... */ };
    // Send data to peers
    this.p2pService.sendDrawingData(data);
  }

  private stopDrawing() {
    this.drawing = false;
    this.ctx.beginPath(); // Begin a new path to stop drawing lines
  }
}
