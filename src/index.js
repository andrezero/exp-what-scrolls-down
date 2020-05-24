"use strict";

function colorAt(data, i) {
  return [data[i], data[i + 1], data[i + 2]];
}

function extractColors(imageData, blockSize) {
  const data = imageData.data;
  const length = data.length;
  let i = 0;
  const colors = [];
  do {
    colors.push(colorAt(data, i));
  } while ((i += blockSize * 4) < length);
  return colors;
}

function distanceSquared(colorA, colorB) {
  let sum = 0;
  for (let n = 0; n < colorA.length; n++) {
    sum += Math.pow(colorA[n] - colorB[n], 2);
  }
  return sum;
}

function euclidianDistance(colorA, colorB) {
  return Math.sqrt(distanceSquared(colorA, colorB));
}

function distanceMatrix(colors) {
  const length = colors.length;
  const result = [];
  colors.forEach((colorA, indexA) => {
    result[indexA] = [];
    result[indexA][indexA] = 1;
    for (let indexB = 0; indexB < length; indexB++) {
      result[indexA][indexB] =
        indexB > indexA
          ? euclidianDistance(colorA, colors[indexB])
          : result[indexB][indexA];
    }
  });
  return result;
}

function minDistance(distances) {
  return distances.reduce(
    (acc, item, index) => (acc === null || item < distances[acc] ? index : acc),
    null
  );
}

function colorHex(color) {
  const h = color.map(c => {
    const h = c.toString(16)
    return h.length > 1 ? h : '0' + h;
  });
  return `#${h[0]}${h[1]}${h[2]}`
}

class Sampler {
  constructor(img, size = 33, blockSize = 3) {
    this.img = img;
    this.size = size;
    this.blockSize = blockSize;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    this.ctx = canvas.getContext && canvas.getContext("2d");
  }

  at(x, y) {
    const size = this.size;
    this.ctx.drawImage(this.img, x, y, size, size, 0, 0, size, size);

    const imageData = this.ctx.getImageData(0, 0, size, size);
    const colors = extractColors(imageData, this.blockSize);
    const matrix = distanceMatrix(colors);
    const distances = matrix.map(item =>
      item.reduce((acc, distance) => acc + distance)
    );
    const minDistanceIndex = minDistance(distances);

    return colors[minDistanceIndex];
  }
}

const STATE = {
  normal: 0,
  zooming: 1,
  zoomed: 2
}

function main() {
  const img = document.querySelector("img");
  const frame = document.querySelector(".frame");
  const aside = document.querySelector("aside");
  const label = document.querySelector("aside em");
  const sampler = new Sampler(img, 50, 5);
  const naturalSize = {
    w: img.naturalWidth,
    h: img.naturalHeight
  };
  const currentPos = { x: 0, y: 0, width: 0, height: 0 };
  let state = STATE.normal;
  let frameSize;
  let size;
  let center;
  let ratio;

  function handleResize() {
    size = {
      w: img.clientWidth,
      h: img.clientHeight
    };
    frameSize = {
      w: frame.clientWidth,
      h: frame.clientHeight
    };
    center = {
      x: frameSize.w / 2,
      y: frameSize.h / 2,
    }
    ratio = size.h / naturalSize.h;
  }

  function sample(pos) {
    const { x, y } = pos;
    const color = sampler.at(x, y);
    const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    const hex = colorHex(color);
    aside.style.backgroundColor = rgb;
    label.innerText = hex;
    if (euclidianDistance(color, [0,0,0]) > 200) {
      label.style.color = '#000';
    } else {
      label.style.color = '#fff';
    }
  }

  function signal(n) {
    return Math.abs(n) / n;
  }

  function touchPoint(pos) {
    const { x, y } = pos;
    const scaled = {
      x: x * ratio,
      y: y * ratio
    }
    let left = center.x - scaled.x;
    let top = center.y - scaled.y;
    const dist = {
      x: pos.width / 2 - Math.abs(left),
      y: pos.height / 2 - Math.abs(top),
    }
    const minX = ratio * 160;
    const minY = ratio * 200;
    if (dist.x < minX) {
      left -= (minX - dist.x) * signal(left);
    }
    if (dist.y < minY) {
      top -= (minY - dist.y) * signal(top);
    }
    return { x: left, y: top };
  }

  function zoomIn(pos) {
    const scale = 10;
    const { x: left, y: top } = touchPoint(pos);
    img.classList.add('is-zoomed');
    img.style.transform = `scale(${scale}) translate(${left}px, ${top}px)`;
    state = STATE.zoomed;
  }

  function zoomOut() {
    img.classList.remove('is-zoomed');
    img.style.transform = `scale(1) translate(0, 0)`;
    state = STATE.normal;
  }

  function getCoords(ev) {
    if (ev) {
      const rect = img.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / ratio;
      const y = (ev.clientY - rect.top) / ratio;
      currentPos.x = x;
      currentPos.y = y;
      currentPos.width = rect.width;
      currentPos.height = rect.height;
    }
    return currentPos;
  }

  function handleMove(ev) {
    getCoords(ev);
  }

  function handleClick(ev) {
    if (state === STATE.zoomed) {
      return zoomOut();
    }

    const pos =  getCoords(ev);
    sample(pos);
    zoomIn(pos);
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("mousemove", handleMove);
  img.addEventListener("mousedown", handleClick);

  handleResize();

  setInterval(() => {
    if (state !== STATE.zoomed) {
      const pos = getCoords();
      sample(pos);
    }
  }, 750)
}

window.addEventListener("load", main);
