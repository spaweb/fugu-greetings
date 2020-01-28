const canvas = document.querySelector('canvas');
const colorInput = document.querySelector('#color');
const sizeInput = document.querySelector('#size');
const sizeLabel = document.querySelector('label[for="size"]');
const clearButton = document.querySelector('#clear');
const importButton = document.querySelector('#import');
const exportButton = document.querySelector('#export');
const shareButton = document.querySelector('#share');
const copyButton = document.querySelector('#copy');
const pasteButton = document.querySelector('#paste');
const contactsButton = document.querySelector('#contacts');
const scanButton = document.querySelector('#scan');
const wakeLockInput = document.querySelector('#wakelock');
const wakeLockLabel = document.querySelector('label[for="wakelock"]');
const ephemeralInput = document.querySelector('#ephemeral');
const ephemeralLabel = document.querySelector('label[for="ephemeral"]');
const periodicBackgroundSyncButton = document.querySelector(
    '#periodicbackgroundsync');
const toolbar = document.querySelector('.toolbar');

let CANVAS_BACKGROUND = null;
let CANVAS_COLOR = null;

const loadDarkMode = async () => {
  if (window.matchMedia('(prefers-color-scheme)').matches !== 'not all') {
    ({
      canvasBackground: CANVAS_BACKGROUND,
      canvasColor: CANVAS_COLOR,
    } = await import('/js/dark_mode.mjs'));
  } else {
    CANVAS_BACKGROUND = '#ffffff';
    CANVAS_COLOR = '#000000';
  }
};

const ctx = canvas.getContext('2d', {
  alpha: false,
  desynchronized: true,
});

let size = null;
let curX = null;
let curY = null;
let curPressure = 0.5;
let pressed = false;
const TWO_PI = 2 * Math.PI;
const floor = Math.floor;

const clearCanvas = (colorOrEvent = CANVAS_BACKGROUND) => {
  if (typeof colorOrEvent === 'string') {
    CANVAS_BACKGROUND = colorOrEvent;
  }
  ctx.fillStyle = CANVAS_BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colorInput.value;
};
clearButton.addEventListener('click', clearCanvas);

sizeInput.addEventListener('input', () => {
  sizeLabel.textContent = sizeInput.value;
  size = sizeInput.value;
});

colorInput.addEventListener('input', () => {
  ctx.fillStyle = colorInput.value;
});

canvas.addEventListener('pointerdown', ({offsetX, offsetY, pressure}) => {
  curX = floor(offsetX);
  curY = floor(offsetY);
  curPressure = pressure;
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  pressed = true;
});

const pointerMove = ({offsetX, offsetY, pressure}) => {
  curX = floor(offsetX);
  curY = floor(offsetY);
  curPressure = pressure;
};

const pointerUp = () => {
  pressed = false;
  curPressure = 0.5;
  canvas.removeEventListener('pointermove', pointerMove);
  canvas.removeEventListener('pointerup', pointerUp);
};

const draw = () => {
  if (pressed) {
    ctx.beginPath();
    ctx.arc(
        curX,
        curY,
        size * curPressure,
        0,
        TWO_PI,
    );
    ctx.fill();
  }
  requestAnimationFrame(draw);
};

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - toolbar.offsetHeight;
};

const getImageData = () => {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const putImageData = (imageData) => {
  ctx.putImageData(imageData, 0, 0);
};

const drawImage = (image) => {
  ctx.drawImage(image, 0, 0);
};

const drawBlob = async (blob) => {
  const image = new Image();
  image.addEventListener('load', () => {
    drawImage(image);
  });
  image.src = URL.createObjectURL(blob);
};

const toBlob = async () => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      return resolve(blob);
    });
  });
};

(async () => {
  await loadDarkMode();
  colorInput.value = CANVAS_COLOR;
  ctx.fillStyle = CANVAS_COLOR;
  size = sizeInput.value;
  sizeLabel.textContent = size;
  resizeCanvas();
  clearCanvas();
  draw();
})();

let debounce = null;
window.addEventListener('resize', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    const imageData = getImageData();
    resizeCanvas();
    clearCanvas();
    putImageData(imageData);
    debounce = null;
  }, 250);
});

/* 🐡 Fugu features */

const loadShare = () => {
  if ('share' in navigator && 'canShare' in navigator) {
    import('/js/share.mjs');
  }
};

const loadContacts = () => {
  if ('contacts' in navigator) {
    import('/js/contacts.mjs');
  }
};

const loadImportAndExport = () => {
  if ('chooseFileSystemEntries' in window) {
    Promise.all([
      import('/js/import_image.mjs'),
      import('/js/export_image.mjs'),
    ]);
  } else {
    Promise.all([
      import('/js/import_image_legacy.mjs'),
      import('/js/export_image_legacy.mjs'),
    ]);
  }
};

const loadClipboard = () => {
  if ('clipboard' in navigator && 'write' in navigator.clipboard) {
    import('/js/clipboard.mjs');
  }
};

const loadBadge = () => {
  if ('setExperimentalAppBadge' in navigator || 'setAppBadge' in navigator) {
    import('/js/badge.mjs');
  }
};

const loadBarcodeDetection = () => {
  if ('BarcodeDetector' in window) {
    import('/js/barcodes.mjs');
  }
};

const loadWakeLock = () => {
  if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
    import('/js/wake_lock.mjs');
  }
};

const serviceWorkerSupported = 'serviceWorker' in navigator;
const loadServiceWorker = () => {
  if (serviceWorkerSupported) {
    import('/js/register_sw.mjs');
  }
};

const getRegistration = async () => {
  if (!serviceWorkerSupported) {
    return false;
  }
  return await navigator.serviceWorker.ready;
};

const loadPeriodicBackgroundSync = async () => {
  const registration = await getRegistration();
  if (registration && 'periodicSync' in registration) {
    import('/js/periodic_background_sync.mjs');
  }
};

const loadContentIndexing = async () => {
  const registration = await getRegistration();
  if (registration && 'index' in registration) {
    import('/js/content_indexing.mjs');
  }
};

const loadIdleDetection = async () => {
  if ('IdleDetector' in window) {
    import('/js/idle_detection.mjs');
  }
};

const loadFileHandling = async () => {
  if ('launchParams' in window) {
    import('/js/file_handling.mjs');
  }
};

const loadPWACompat = () => {
  if (/\b(iPad|iPhone|iPod)\b/.test(navigator.userAgent)) {
    import('https://unpkg.com/pwacompat');
  }
};

(async () => {
  await Promise.all([
    loadShare(),
    loadContacts(),
    loadClipboard(),
    loadImportAndExport(),
    loadBadge(),
    loadBarcodeDetection(),
    loadServiceWorker(),
    loadWakeLock(),
    loadIdleDetection(),
    loadFileHandling(),
    loadPWACompat(),
    loadPeriodicBackgroundSync(),
    loadContentIndexing(),
  ]);
})();

export {
  // Core:
  canvas,
  ctx,
  CANVAS_BACKGROUND,
  CANVAS_COLOR,
  // UI elements:
  colorInput,
  contactsButton,
  copyButton,
  pasteButton,
  exportButton,
  importButton,
  clearButton,
  shareButton,
  scanButton,
  wakeLockInput,
  wakeLockLabel,
  ephemeralInput,
  ephemeralLabel,
  periodicBackgroundSyncButton,
  // Functions:
  clearCanvas,
  toBlob,
  drawImage,
  drawBlob,
  floor,
};