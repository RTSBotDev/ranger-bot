function PathableLocations(): boolean[][] {
  let output: boolean[][] = [];
  const map_width: number = scope.getMapWidth();
  const map_height: number = scope.getMapHeight();
  for (let x:number=0; x<=map_width; x++) {
    output[x] = [];
    for (let y:number=0; y<=map_height; y++) {
      output[x][y] = !!(scope.positionIsPathable(x, y));
    }
  }
  return output;
}

export { PathableLocations };
