import { Component, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  @Output() colorChange = new EventEmitter<string>();
  @Output() brushSizeChange = new EventEmitter<number>();
  @Output() canvasClear = new EventEmitter<void>();



  setColor(color: string) {
    this.colorChange.emit(color);
  }

  setBrushSize(event: Event) {
    const input = event.target as HTMLInputElement;
    this.brushSizeChange.emit(parseInt(input.value, 10));
  }

  clearCanvas() {
    this.canvasClear.emit();
  }
  


}
