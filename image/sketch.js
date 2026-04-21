let img; // 이미지를 저장할 변수

// preload( ) 함수는 p5.js의 setup( )과 draw( ) 함수가 시작되기 전에 실행되는 함수이다.
// 사용할 모든 리소스는 preload( ) 함수에서 로딩하는 것이 안전하다.
function preload() {
  // loadImage( ) 함수는 이미지 파일을 로딩하는 함수이다. 
  // 파라미터로 폴더 이름과 파일 이름을 정확히 적어주자.
  img = loadImage('assets/sunflowers.jpg'); 
}

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(220);
  image(img, 0, 0); // 파라미터는 순서대로 (이미지, x, y)이다. (x, y) 위치가 이미지가 그려질 좌측 상단이다.
}