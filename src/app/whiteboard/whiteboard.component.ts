import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { HostListener } from '@angular/core';
import { P2pService } from '../p2p.service'; 
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.css']
})

export class WhiteboardComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('whiteboardCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private dataSubscription: Subscription = new Subscription();
  currentColor: string = 'black';
  currentBrushSize: number = 4;

  constructor(private p2pService: P2pService) {}
  ngOnInit() {
    this.dataSubscription = this.p2pService.getDataUpdates().subscribe(
      (data) => {
        // Handle the incoming data, for example:
        this.updateCanvas(data);
      }
    );
  }

  private updateCanvas(data: any) {
    // Assuming data contains x, y, color, and lineWidth
    this.ctx.lineWidth = data.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = data.color;
  
    this.ctx.lineTo(data.x, data.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(data.x, data.y);
  }

  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }
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
    this.ctx.lineWidth = 4; 
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = 'black'; 

    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);

    // Prepare the data to be sent
    const data = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      color: this.ctx.strokeStyle,
      lineWidth: this.ctx.lineWidth,
      
    };
    // Send data to peers
    this.p2pService.sendDrawingData(data);
  }

  // Methods to update color and brush size
  changeColor(newColor: string) {
    this.currentColor = newColor;
    this.ctx.strokeStyle = this.currentColor;
  }

  changeBrushSize(newSize: number) {
    this.currentBrushSize = newSize;
    this.ctx.lineWidth = this.currentBrushSize;
  }
  // Clear the canvas
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

  private stopDrawing() {
    this.drawing = false;
    this.ctx.beginPath(); // Begin a new path to stop drawing lines
  }
}
