int startX , startY, endX, endY;
int red , green, blue;

void setup() {
  startX = (width / 2) - 100;
  startY = (height / 2) - 100;
  endX = (width / 2) + 100;
  endY = (height / 2) + 100;
  
  red = 100;
  green = 50;
  blue = 120;
  
  size(800,1000);
  
  pixelDensity(4);
}

void draw() {  
  strokeWeight(4);  // Default
  stroke(red, green, blue);
  line(startX, startY, endX, endY); 
  
  startX += random(-3, 3);
  startY += random(-3, 3);
  endX += random(-3, 3);
  endY += random(-3, 3);
  
  if(startX > width) startX = 0;
  if(startX < 0) startX = width;
  if(startY > height) startY = 0;
  if(startY < 0) startY = height;
  
  if(endX > width) endX = 0;
  if(endX < 0) endX = width;
  if(endY > height) endY = 0;
  if(endY < 0) endY = height;
  
  red += random(-2, 2);
  green += random(-2, 2);
  blue += random(-2, 2);
  
  if(red > 255) red = 0;
  if(red < 0) red = 255;
  if(green > 255) green = 0;
  if(green < 0) green = 255;
  if(blue > 255) blue = 0;
  if(blue < 0) blue = 255;
  
}


void keyPressed() {
  save("diagonal.tif");
}
