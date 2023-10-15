import processing.video.*;

Capture cam;

PImage img;

int pixelSize = 10;

void setup() {
  size(1080, 1440);

  img = loadImage("image.jpg");
  updatePixel();
}

void draw() {

  if (mousePressed == true) {
    pixelSize += 1;
  }
}

void updatePixel() {
  noStroke();

  for (int x = 0; x < width; x += pixelSize) {
    for (int y = 0; y < height; y += pixelSize) {
      fill(img.get(x, y));
      //fillWithAverageColor(x, y, pixelSize);
      rect(x, y, pixelSize, pixelSize);
    }
  }
}

void fillWithAverageColor(int startingX, int startingY, int pixelSize) {
  int totalRed = 0;
  int totalBlue = 0;
  int totalGreen = 0;

  for (int x = startingX; x < startingX + pixelSize; x ++) {
    for (int y = startingY; y < startingY + pixelSize; y ++) {
      if (y < img.height && x < img.width) {
        totalRed += red(img.pixels[y * img.width + x]);
        totalBlue += blue(img.pixels[y * img.width + x]);
        totalGreen += green(img.pixels[y * img.width + x]);
      }
    }
  }
  
  int averagePixelCount = pixelSize * pixelSize;

  totalRed = totalRed / averagePixelCount;
  totalBlue = totalBlue / averagePixelCount;
  totalGreen = totalGreen / averagePixelCount;
  
  fill(totalRed, totalGreen, totalBlue);
  println(totalGreen);
}
