const $color = (function () {
  //随机颜色值
  const randomColor = (min = 0, max = 255) => {
    const rgb = [min, min, min];
    let randomValue = Math.floor(Math.random() * (max - min) + min);
    let randomIndex = Math.floor(Math.random() * 3);
    let indexMax = (randomIndex + Math.floor(Math.random() * 2 + 1)) % 3;
    rgb[indexMax] = max;
    rgb[randomIndex] = randomValue;
    return rgb;
  };
  return {
    randomColor,
  };
})();
