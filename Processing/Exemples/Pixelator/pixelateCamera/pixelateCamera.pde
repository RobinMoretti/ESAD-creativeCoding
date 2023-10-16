import processing.video.*;

Capture cam;

int pixelSize = 20;

void setup() {
  size(640, 480);

  String[] cameras = Capture.list();

  if (cameras.length == 0) {
    println("Aucune caméra de disponible");
    exit();
  } else {
    println("Cameras disponibles :");
    for (int i = 0; i < cameras.length; i++) {
      println(cameras[i]);
    }


    cam = new Capture(this, cameras[0]);
    cam.start();
  }
}

void draw() {
  if (cam.available() == true) {
    cam.read();
  }

  updatePixel();

  if (mousePressed == true) {
    pixelSize += 1;
  }
}

void updatePixel() {
  noStroke();

  for (int x = 0; x < width; x += pixelSize) {
    for (int y = 0; y < height; y += pixelSize) {
      fill(cam.get(x, y));
      rect(x, y, pixelSize, pixelSize);
    }
  }
}
