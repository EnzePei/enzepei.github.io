const TWO_PI = Math.PI * 2;

document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const targetElement = document.querySelector(link.getAttribute('href'));

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });
});

function initDotField() {
  const canvas = document.querySelector('.dot-field');
  const hero = document.querySelector('.hero');

  if (!canvas || !hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const dots = [];
  const mouse = {
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    speed: 0,
  };
  const settings = {
    dotRadius: 2.4,
    dotSpacing: 13,
    cursorRadius: 420,
    bulgeStrength: 70,
    waveAmplitude: 0.9,
    gradientFrom: 'rgba(0, 0, 0, 0.34)',
    gradientTo: 'rgba(0, 0, 0, 0.14)',
  };

  let width = 0;
  let height = 0;
  let offsetX = 0;
  let offsetY = 0;
  let frameCount = 0;
  let engagement = 0;
  let resizeTimer;
  let rafId;

  function buildDots() {
    const step = settings.dotRadius + settings.dotSpacing;
    const cols = Math.floor(width / step);
    const rows = Math.floor(height / step);
    const padX = (width % step) / 2;
    const padY = (height % step) / 2;

    dots.length = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots.push({ ax, ay, sx: ax, sy: ay });
      }
    }
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    offsetX = rect.left + window.scrollX;
    offsetY = rect.top + window.scrollY;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildDots();
  }

  function scheduleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  }

  function updateMouse(event) {
    mouse.x = event.pageX - offsetX;
    mouse.y = event.pageY - offsetY;
  }

  function fadeMouse() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  function updateMouseSpeed() {
    const dx = mouse.prevX - mouse.x;
    const dy = mouse.prevY - mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    mouse.speed += (distance - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
  }

  function draw() {
    frameCount++;
    updateMouseSpeed();

    const targetEngagement = Math.min(mouse.speed / 5, 1);
    engagement += (targetEngagement - engagement) * 0.06;
    if (engagement < 0.001) engagement = 0;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, settings.gradientFrom);
    gradient.addColorStop(1, settings.gradientTo);
    ctx.fillStyle = gradient;
    ctx.beginPath();

    const cursorRadiusSq = settings.cursorRadius * settings.cursorRadius;
    const radius = settings.dotRadius / 2;
    const time = frameCount * 0.02;

    dots.forEach(dot => {
      const dx = mouse.x - dot.ax;
      const dy = mouse.y - dot.ay;
      const distSq = dx * dx + dy * dy;

      if (distSq < cursorRadiusSq && engagement > 0.01) {
        const dist = Math.sqrt(distSq);
        const pull = 1 - dist / settings.cursorRadius;
        const push = pull * pull * settings.bulgeStrength * engagement;
        const angle = Math.atan2(dy, dx);
        dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
        dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
      } else {
        dot.sx += (dot.ax - dot.sx) * 0.1;
        dot.sy += (dot.ay - dot.sy) * 0.1;
      }

      const drawX = dot.sx + Math.cos(dot.ay * 0.03 + time * 0.7) * settings.waveAmplitude;
      const drawY = dot.sy + Math.sin(dot.ax * 0.03 + time) * settings.waveAmplitude;

      ctx.moveTo(drawX + radius, drawY);
      ctx.arc(drawX, drawY, radius, 0, TWO_PI);
    });

    ctx.fill();
    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', scheduleResize);
  window.addEventListener('mousemove', updateMouse, { passive: true });
  hero.addEventListener('mouseleave', fadeMouse);
  rafId = requestAnimationFrame(draw);

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    clearTimeout(resizeTimer);
  });
}

initDotField();

function initPhotoStacks() {
  const stacks = document.querySelectorAll('[data-photo-stack]');

  stacks.forEach(stack => {
    const cards = Array.from(stack.querySelectorAll('.card-rotate'));
    if (!cards.length) return;

    let order = cards.map((_, index) => index);
    let dragState;

    function transformForPosition(position, drag = {}) {
      const rotate = (order.length - position - 1) * 4 - 8;
      const scale = 1 + position * 0.045 - order.length * 0.045;
      const x = drag.x || 0;
      const y = drag.y || 0;
      const rotateX = Math.max(-18, Math.min(18, y * -0.18));
      const rotateY = Math.max(-18, Math.min(18, x * 0.18));

      return [
        `translate3d(${x}px, ${y}px, ${position * 7}px)`,
        `rotateX(${rotateX}deg)`,
        `rotateY(${rotateY}deg)`,
        `rotateZ(${rotate}deg)`,
        `scale(${scale})`,
      ].join(' ');
    }

    function render() {
      order.forEach((cardIndex, position) => {
        const card = cards[cardIndex];
        card.style.zIndex = position + 1;
        card.style.transformOrigin = '90% 90%';
        card.style.transform = transformForPosition(position);
      });
    }

    function sendTopToBack() {
      const topCard = order[order.length - 1];
      order = [topCard, ...order.slice(0, -1)];
      render();
    }

    function getTopCard() {
      return cards[order[order.length - 1]];
    }

    function resetDraggedCard() {
      if (!dragState) return;
      dragState.card.classList.remove('is-dragging');
      render();
      dragState = undefined;
    }

    function startDrag(event) {
      const topCard = getTopCard();
      if (!topCard || !topCard.contains(event.target)) return;

      dragState = {
        card: topCard,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: 0,
        y: 0,
        moved: false,
      };

      topCard.classList.add('is-dragging');
      topCard.setPointerCapture?.(event.pointerId);
    }

    function moveDrag(event) {
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      dragState.x = event.clientX - dragState.startX;
      dragState.y = event.clientY - dragState.startY;
      dragState.moved = Math.abs(dragState.x) > 5 || Math.abs(dragState.y) > 5;

      const position = order.indexOf(cards.indexOf(dragState.card));
      dragState.card.style.transform = transformForPosition(position, dragState);
    }

    function endDrag(event) {
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      const distance = Math.hypot(dragState.x, dragState.y);
      const wasClick = !dragState.moved;
      dragState.card.releasePointerCapture?.(event.pointerId);
      dragState.card.classList.remove('is-dragging');
      dragState = undefined;

      if (distance > 150 || wasClick) {
        sendTopToBack();
      } else {
        render();
      }
    }

    render();
    stack.addEventListener('pointerdown', startDrag);
    stack.addEventListener('pointermove', moveDrag);
    stack.addEventListener('pointerup', endDrag);
    stack.addEventListener('pointercancel', resetDraggedCard);
  });
}

initPhotoStacks();

function initAnimatedLists() {
  const containers = document.querySelectorAll('[data-animated-list]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  containers.forEach(container => {
    const list = container.querySelector('.scroll-list');
    const items = Array.from(container.querySelectorAll('.animated-item'));
    const topGradient = container.querySelector('.top-gradient');
    const bottomGradient = container.querySelector('.bottom-gradient');
    let selectedIndex = items.findIndex(item => item.querySelector('.item.selected'));
    if (selectedIndex < 0) selectedIndex = 0;

    function setSelected(index) {
      selectedIndex = Math.max(0, Math.min(index, items.length - 1));
      items.forEach((item, itemIndex) => {
        item.querySelector('.item')?.classList.toggle('selected', itemIndex === selectedIndex);
      });
    }

    function updateGradients() {
      if (!list) return;
      const { scrollTop, scrollHeight, clientHeight } = list;
      const bottomDistance = scrollHeight - (scrollTop + clientHeight);

      if (topGradient) topGradient.style.opacity = Math.min(scrollTop / 50, 1);
      if (bottomGradient) {
        bottomGradient.style.opacity = scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1);
      }
    }

    function scrollSelectedIntoView() {
      const selectedItem = items[selectedIndex];
      if (!list || !selectedItem) return;

      const extraMargin = 48;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      const visibleTop = list.scrollTop + extraMargin;
      const visibleBottom = list.scrollTop + list.clientHeight - extraMargin;

      if (itemTop < visibleTop) {
        list.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > visibleBottom) {
        list.scrollTo({ top: itemBottom - list.clientHeight + extraMargin, behavior: 'smooth' });
      }
    }

    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => setSelected(index));
      item.addEventListener('click', () => setSelected(index));
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            entry.target.classList.toggle('is-visible', entry.isIntersecting);
          });
        },
        {
          root: list,
          threshold: 0.45,
        }
      );

      items.forEach((item, index) => {
        item.style.transitionDelay = `${Math.min(index * 0.035, 0.18)}s`;
        observer.observe(item);
      });
    }

    container.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
        event.preventDefault();
        setSelected(selectedIndex + 1);
        scrollSelectedIntoView();
      } else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
        event.preventDefault();
        setSelected(selectedIndex - 1);
        scrollSelectedIntoView();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        items[selectedIndex]?.click();
      }
    });

    list?.addEventListener('scroll', updateGradients, { passive: true });
    setSelected(selectedIndex);
    updateGradients();
  });
}

initAnimatedLists();

function initCardSwap() {
  const container = document.querySelector('[data-card-swap]');
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.work-item'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const config = {
    distanceX: 70,
    distanceY: 64,
    distanceZ: 105,
    skew: 4,
    delay: 2600,
    dropDistance: 520,
  };
  let order = cards.map((_, index) => index);
  let intervalId;
  let isSwapping = false;
  let resumeTimer;

  function makeSlot(index) {
    return {
      x: index * config.distanceX,
      y: -index * config.distanceY,
      z: -index * config.distanceZ,
      zIndex: cards.length - index,
    };
  }

  function transformForSlot(slot, extraY = 0, options = {}) {
    const {
      extraX = 0,
      zBoost = 0,
      rotateY = 0,
      rotateZ = 0,
      scale = 1,
    } = options;

    return [
      'translate(-50%, -50%)',
      `translate3d(${slot.x + extraX}px, ${slot.y + extraY}px, ${slot.z + zBoost}px)`,
      `rotateY(${rotateY}deg)`,
      `rotateZ(${rotateZ}deg)`,
      `skewY(${config.skew}deg)`,
      `scale(${scale})`,
    ].join(' ');
  }

  function placeCards(animate = true) {
    order.forEach((cardIndex, slotIndex) => {
      const card = cards[cardIndex];
      const slot = makeSlot(slotIndex);
      const transform = transformForSlot(slot);

      card.classList.toggle('is-moving', animate);
      card.classList.remove('is-dropping');
      card.style.zIndex = slot.zIndex;
      card.style.transform = transform;
      card.style.setProperty('--card-transform', transform);
    });
  }

  function swapCards() {
    if (isSwapping || order.length < 2) return;
    isSwapping = true;

    const [frontIndex, ...rest] = order;
    const frontCard = cards[frontIndex];
    const frontSlot = makeSlot(0);
    const backSlot = makeSlot(cards.length - 1);

    frontCard.classList.add('is-moving', 'is-dropping');
    frontCard.style.transform = transformForSlot(frontSlot, config.dropDistance);
    frontCard.style.setProperty('--card-transform', frontCard.style.transform);

    window.setTimeout(() => {
      order = [...rest, frontIndex];
      placeCards(true);
    }, 320);

    window.setTimeout(() => {
      frontCard.style.zIndex = backSlot.zIndex;
    }, 440);

    window.setTimeout(() => {
      isSwapping = false;
    }, 1150);
  }

  function promoteCard(cardIndex) {
    if (isSwapping || order[0] === cardIndex) return;
    isSwapping = true;

    const card = cards[cardIndex];
    const slotIndex = order.indexOf(cardIndex);
    const currentSlot = makeSlot(slotIndex);
    const flipTransform = transformForSlot(currentSlot, -96, {
      extraX: -28,
      zBoost: 260,
      rotateY: -18,
      rotateZ: -2,
      scale: 1.04,
    });

    card.classList.add('is-moving', 'is-flipping');
    card.style.zIndex = cards.length + 2;
    card.style.transform = flipTransform;
    card.style.setProperty('--card-transform', flipTransform);

    window.setTimeout(() => {
      order = [cardIndex, ...order.filter(index => index !== cardIndex)];
      placeCards(true);
    }, 220);

    window.setTimeout(() => {
      card.classList.remove('is-flipping');
      isSwapping = false;
    }, 1050);
  }

  function getPointerCard(event) {
    const containerRect = container.getBoundingClientRect();
    const cardRect = cards[0]?.getBoundingClientRect();
    if (!cardRect) return undefined;

    const pointerX = event.clientX - containerRect.left;
    const pointerY = event.clientY - containerRect.top;
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;

    const candidates = order
      .map((cardIndex, slotIndex) => {
        const slot = makeSlot(slotIndex);
        const cardCenterX = centerX + slot.x;
        const cardCenterY = centerY + slot.y;
        const insideX = pointerX >= cardCenterX - cardWidth / 2 && pointerX <= cardCenterX + cardWidth / 2;
        const insideY = pointerY >= cardCenterY - cardHeight / 2 && pointerY <= cardCenterY + cardHeight / 2;
        const distance = Math.hypot(pointerX - cardCenterX, pointerY - cardCenterY);

        return {
          cardIndex,
          slotIndex,
          distance,
          isInside: insideX && insideY,
        };
      })
      .filter(candidate => candidate.isInside);

    if (!candidates.length) return undefined;

    candidates.sort((a, b) => {
      if (a.slotIndex !== b.slotIndex && Math.abs(a.distance - b.distance) < 90) {
        return b.slotIndex - a.slotIndex;
      }
      return a.distance - b.distance;
    });

    return candidates[0].cardIndex;
  }

  function openCardLink(card) {
    const link = card.querySelector('a[href]');
    if (!link) return;

    if (link.target === '_blank') {
      window.open(link.href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = link.href;
    }
  }

  function start() {
    if (!prefersReducedMotion && !intervalId) {
      intervalId = window.setInterval(swapCards, config.delay);
    }
  }

  function stop() {
    clearInterval(intervalId);
    intervalId = undefined;
    clearTimeout(resumeTimer);
  }

  function scheduleRestart() {
    clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(start, 1200);
  }

  placeCards(false);
  if (!prefersReducedMotion) {
    window.setTimeout(swapCards, 450);
  }
  start();

  container.addEventListener('mouseenter', stop);
  container.addEventListener('click', event => {
    const cardIndex = getPointerCard(event);

    if (cardIndex !== undefined && cardIndex !== order[0]) {
      event.preventDefault();
      stop();
      promoteCard(cardIndex);
      scheduleRestart();
      return;
    }

    if (cardIndex === order[0] && !event.target.closest('a')) {
      stop();
      openCardLink(cards[cardIndex]);
      scheduleRestart();
    }
  });
  container.addEventListener('mouseleave', () => {
    scheduleRestart();
  });
  window.addEventListener('resize', () => placeCards(false));
}

initCardSwap();

function initLogoLoops() {
  const loops = document.querySelectorAll('[data-logo-loop]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  loops.forEach(loop => {
    const track = loop.querySelector('.logoloop__track');
    const list = loop.querySelector('.logoloop__list');
    if (!track || !list) return;

    const speed = 20;
    let sequenceWidth = 0;
    let offset = 0;
    let lastTimestamp;
    let rafId;
    let isHovered = false;

    function removeClones() {
      track.querySelectorAll('.logoloop__list[aria-hidden="true"]').forEach(clone => clone.remove());
    }

    function buildCopies() {
      removeClones();
      sequenceWidth = list.getBoundingClientRect().width;
      if (!sequenceWidth) return;

      const copiesNeeded = Math.max(2, Math.ceil(loop.clientWidth / sequenceWidth) + 2);
      for (let i = 1; i < copiesNeeded; i++) {
        const clone = list.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a').forEach(link => {
          link.tabIndex = -1;
        });
        track.appendChild(clone);
      }
    }

    function animate(timestamp) {
      if (lastTimestamp === undefined) {
        lastTimestamp = timestamp;
      }

      const delta = Math.max(0, timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!isHovered && sequenceWidth > 0) {
        offset = (offset + speed * delta) % sequenceWidth;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    }

    function refresh() {
      buildCopies();
      offset %= sequenceWidth || 1;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }

    refresh();

    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(animate);
      loop.addEventListener('mouseenter', () => {
        isHovered = true;
      });
      loop.addEventListener('mouseleave', () => {
        isHovered = false;
        lastTimestamp = undefined;
      });
    }

    window.addEventListener('resize', refresh);
    window.addEventListener('beforeunload', () => cancelAnimationFrame(rafId));
  });
}

initLogoLoops();
