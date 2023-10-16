int pointsCount = 100;

float[][] points;

void setup() {
  size(500, 500);
  initPoints();
}

void draw() {
  background(251);
  movePoints();
  drawEllipses();
  drawLines();
}

void movePoints() {
  for (int i = 0; i < points.length; i ++) {
    points[i][0] += random(-1, 1);
    points[i][1] += random(-1, 1);
  }
}
void initPoints() {
  points = new float[pointsCount][2];

  for (int i = 0; i < points.length; i ++) {
    points[i][0] = random(0, width);
    points[i][1] = random(0, height);
  }
}

void drawEllipses() {
  for (int i = 0; i < points.length; i ++) {
    ellipse(points[i][0], points[i][1], 10, 10);
  }
}

void drawLines() {
  for (int i = 0; i < points.length - 1; i ++) {
    line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
}
