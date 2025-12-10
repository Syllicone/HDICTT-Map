(function(){
  const topStrip = document.querySelector('.top-strip');
  const bottomStrip = document.querySelector('.bottom-strip');
  const wordIt = document.getElementById('word-it');
  const wordThis = document.getElementById('word-this');
  const info = document.getElementById('infobox');
  const DEFAULT_INFO = "click around and interact with the words, try 'it' or 'this'?";
  
  const topStripBoxes = document.querySelectorAll('.top-strip .top-box');
  const bottomStripBoxes = document.querySelectorAll('.bottom-strip .bottom-box');

  // init
  topStrip?.classList.remove('visible-by-it');
  bottomStrip?.classList.remove('visible-by-this');
  [wordIt, wordThis].forEach(el => el && (el.dataset.replaced ||= '0'));
  info && (info.textContent = DEFAULT_INFO, info.classList.add('visible'));

  // Helper: Check strip visibility
  const isTopStripVisible = () => topStrip?.classList.contains('visible-by-it');
  const isBottomStripVisible = () => bottomStrip?.classList.contains('visible-by-this');

  // Helper: Clear overlay highlights
  function clearOverlayHighlights() {
    topStripBoxes.forEach(b => b.classList.remove('overlay-active'));
    bottomStripBoxes.forEach(b => b.classList.remove('overlay-active'));
  }

  // Helper: Toggle highlight class on boxes
  function toggleBoxHighlight(boxes, action) {
    boxes.forEach(box => box.classList[action]('highlight'));
  }

  function showTransient(msg, dur = 2500) {
    if (!info) return;
    clearTimeout(info._t);
    info.textContent = msg;
    info.classList.add('transient');
    info._t = setTimeout(() => {
      info.classList.remove('transient');
      info.textContent = DEFAULT_INFO;
    }, dur);
  }

  function updateStrips() {
    if (topStrip && wordIt) {
      topStrip.classList.toggle('visible-by-it', wordIt.dataset.replaced === '1');
    }
    if (bottomStrip && wordThis) {
      bottomStrip.classList.toggle('visible-by-this', wordThis.dataset.replaced === '1');
    }
  }

  function toggleReplace(el) {
    const label = el.querySelector('.label');
    const { original, replacement, replaced } = el.dataset;
    const wasReplaced = replaced === '1';
    label.textContent = wasReplaced ? original : replacement;
    el.dataset.replaced = wasReplaced ? '0' : '1';
    showTransient(wasReplaced ? `Restored "${original}"` : `"${original}"  "${replacement}"`);
    updateStrips();
  }

  // Event delegation for interactive words
  document.querySelectorAll('.interactive-word').forEach(el => {
    el.addEventListener('click', e => { 
      toggleReplace(e.currentTarget); 
      e.currentTarget.blur(); 
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        toggleReplace(e.currentTarget); 
      }
    });
  });

  // Event delegation for box clicks
  function handleBoxClick(e, position, boxes) {
    const box = e.target.closest(`.${position}-box`);
    if (!box) return;
    
    e.stopPropagation();
    const index = Array.from(boxes).indexOf(box);
    const text = box.querySelector('div').textContent;
    showOverlay(position, text, box, index);
  }

  topStrip?.addEventListener('click', e => handleBoxClick(e, 'top', topStripBoxes));
  bottomStrip?.addEventListener('click', e => handleBoxClick(e, 'bottom', bottomStripBoxes));

  function showOverlay(position, text, clickedBox, clickedIndex) {
    // Remove existing overlay and clear highlights
    document.querySelectorAll(`.strip-overlay.${position}`).forEach(o => o.remove());
    clearOverlayHighlights();

    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = `strip-overlay ${position} active`;

    const referencesDiv = clickedBox?.querySelector('.box-references');
    const descriptionEl = referencesDiv?.querySelector('.overlay-description');
    const referencesList = referencesDiv?.querySelector('.reference-list');

    const descriptionHTML = descriptionEl?.innerHTML || '';
    const referencesHTML = referencesList?.innerHTML || '';

    overlay.innerHTML = `
      <span class="overlay-close"></span>
      <div class="overlay-header">
        <h3>${text}</h3>
        ${descriptionHTML ? `<p class="overlay-description">${descriptionHTML}</p>` : ''}
      </div>
      ${referencesHTML ? `<ul class="reference-list">${referencesHTML}</ul>` : ''}
    `;

    document.body.appendChild(overlay);

    // Highlight corresponding box in opposite strip
    const targetBoxes = position === 'top' ? bottomStripBoxes : topStripBoxes;
    const isVisible = position === 'top' ? isBottomStripVisible() : isTopStripVisible();
    
    if (targetBoxes[clickedIndex] && isVisible) {
      targetBoxes[clickedIndex].classList.add('overlay-active');
    }

    // Close button handler
    overlay.querySelector('.overlay-close').addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.remove();
      clearOverlayHighlights();
    });

    // Prevent links from closing overlay
    overlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', e => e.stopPropagation());
    });
  }

  // Click anywhere to close overlays
  document.addEventListener('click', (e) => {
    if (e.target.closest('.top-strip, .bottom-strip, .strip-overlay, .interactive-word, .container')) {
      return;
    }

    const clickY = e.clientY;
    const halfHeight = window.innerHeight / 2;
    const overlayClass = clickY < halfHeight ? '.strip-overlay.top' : '.strip-overlay.bottom';
    
    document.querySelectorAll(overlayClass).forEach(o => o.remove());
    clearOverlayHighlights();
  });

  updateStrips();

  // Word hover handlers
  if (wordIt) {
    wordIt.addEventListener('mouseenter', () => {
      if (wordIt.dataset.replaced === '1' && isTopStripVisible()) {
        toggleBoxHighlight(topStripBoxes, 'add');
      }
    });
    wordIt.addEventListener('mouseleave', () => toggleBoxHighlight(topStripBoxes, 'remove'));
  }

  if (wordThis) {
    wordThis.addEventListener('mouseenter', () => {
      if (wordThis.dataset.replaced === '1' && isBottomStripVisible()) {
        toggleBoxHighlight(bottomStripBoxes, 'add');
      }
    });
    wordThis.addEventListener('mouseleave', () => toggleBoxHighlight(bottomStripBoxes, 'remove'));
  }

  // Cross-strip hover highlighting
  topStripBoxes.forEach((box, index) => {
    box.addEventListener('mouseenter', () => {
      if (bottomStripBoxes[index] && isTopStripVisible() && isBottomStripVisible()) {
        bottomStripBoxes[index].classList.add('highlight');
      }
    });
    box.addEventListener('mouseleave', () => bottomStripBoxes[index]?.classList.remove('highlight'));
  });

  bottomStripBoxes.forEach((box, index) => {
    box.addEventListener('mouseenter', () => {
      if (topStripBoxes[index] && isTopStripVisible() && isBottomStripVisible()) {
        topStripBoxes[index].classList.add('highlight');
      }
    });
    box.addEventListener('mouseleave', () => topStripBoxes[index]?.classList.remove('highlight'));
  });
})();
