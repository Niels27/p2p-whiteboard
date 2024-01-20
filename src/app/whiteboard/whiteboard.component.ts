import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit,Input } from '@angular/core';
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
  @ViewChild('fileInput') fileInput!: ElementRef;
  @Input() color: string = 'black';
  @Input() brushSize: number = 5;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private dataSubscription: Subscription = new Subscription();
  private imageDataSubscription: Subscription = new Subscription();


  constructor(private p2pService: P2pService) {}


  ngOnInit() {
    // Subscription for drawing data
    this.dataSubscription = this.p2pService.getDataUpdates().subscribe(
      (data) => {
        this.updateCanvas(data);
      }
    );

    // subscription for image data
    this.imageDataSubscription = this.p2pService.imageReceived$.subscribe(imageData => {
      this.drawImage(imageData.data, imageData.x, imageData.y, imageData.width, imageData.height);
    });
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
    if (this.imageDataSubscription) {
      this.imageDataSubscription.unsubscribe();
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
    this.ctx.lineWidth = this.brushSize; // Use @Input brushSize
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.color; // Use @Input color

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

  private stopDrawing() {
    this.drawing = false;
    this.ctx.beginPath(); 
  }

  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.loadImage(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy'; 
    this.setDragOverStyle(true); 
  }

  onDragLeave(event: DragEvent) {
    this.setDragOverStyle(false); 
  }

  onDrop(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.setDragOverStyle(false);
  
    const files = event.dataTransfer!.files;
    if (files.length > 0) {
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left; // Convert to canvas coordinates
      const y = event.clientY - rect.top;
      this.loadImage(files[0], x, y);
    }
  }
  

  setDragOverStyle(isOver: boolean) {
    const whiteboardDiv = this.canvas.nativeElement.parentElement;
    if (whiteboardDiv) {
      if (isOver) {
        whiteboardDiv.classList.add('dragover');
      } else {
        whiteboardDiv.classList.remove('dragover');
      }
    }
  }

  loadImage(file: File, dropX?: number, dropY?: number) {
    const reader = new FileReader();
    reader.onload = (event: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Maximum and minimum dimensions
        const maxWidth = 200, maxHeight = 200;
        const minWidth = 50, minHeight = 50;
  
        // Calculate scaling factor
        let width = img.width;
        let height = img.height;
  
        const widthScale = Math.min(maxWidth / width, 1);
        const heightScale = Math.min(maxHeight / height, 1);
        const scale = Math.min(widthScale, heightScale);
  
        width *= scale;
        height *= scale;
  
        // Ensure the image is not too small
        if (width < minWidth || height < minHeight) {
          const minScale = Math.max(minWidth / width, minHeight / height);
          width *= minScale;
          height *= minScale;
        }
  
        // Calculate the position to draw the image
        const x = dropX ? dropX - width / 2 : 50; // Center the image on cursor if coordinates are provided
        const y = dropY ? dropY - height / 2 : 50;
  
        // Draw the image with calculated dimensions
        this.ctx.drawImage(img, x, y, width, height);

        // Encode the canvas to data URL
        const resizedDataUrl = canvas.toDataURL('image/jpeg');

        // Send the image data to the peer
        const imgData = {
          type: 'image',
          data: event.target.result, 
          //data: resizedDataUrl,
          x: x,
          y: y,
          width: width,
          height: height
        };
        
        this.p2pService.sendDataToPeer(imgData);
    
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  drawImage(dataUrl: string, x: number, y: number, width: number, height: number) {
    if (this.ctx) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, x, y, width, height);
      };
      img.onerror = (error) => {
        console.error("Error loading image: ", error);
      };
      img.src = dataUrl;
    } else {
      console.error("Canvas context is not valid.");
    }
  }
  
  

}
