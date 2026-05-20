/**
 * Timeline Component Handler
 * Handles interactive timeline functionality for both PC (horizontal) and mobile (vertical) views
 */

class TimelineComponent {
  constructor() {
    this.container = document.querySelector('.timeline-container');
    if (!this.container) return;
    
    this.track = this.container.querySelector('.timeline-track');
    this.points = Array.from(this.container.querySelectorAll('.timeline-point'));
    this.edgePoints = Array.from(this.container.querySelectorAll('.timeline-edge-point'));
    this.focusTargets = Array.from(this.container.querySelectorAll('.timeline-edge-point, .timeline-point'));
    this.infoSection = this.container.querySelector('.timeline-info');
    this.isPC = window.innerWidth >= 768;
    
    this.currentFocusIndex = 0;
    this.pointSpacing = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timeline-point-spacing'));
    this.transitionDuration = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--timeline-transition-duration')
        .replace('ms', '')
    );
    this.edgeDotSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timeline-edge-dot-size'));
    this.timelineDelay = 120;
    
    this.init();
  }

  init() {
    if (!this.track || this.focusTargets.length === 0) return;

    // Position points and edge points based on their order
    this.focusTargets.forEach((point, index) => {
      point.dataset.index = index;
      this.isPC ? this.positionPointPC(point, index) : this.positionPointMobile(point, index);
    });

    this.calculateTrackLayout();

    if (this.isPC && window.gsap && window.ScrollTrigger) {
      this.initGSAP();
    }

    this.setupEventListeners();
    
    // Initial state
    this.updateFocusedPoint();
    this.updateInfo();
    this.updateTrackTransform(0);
    
    // Set initial background on mobile
    if (!this.isPC) {
      this.updateMobileBackground();
    }
  }

  /**
   * Position point along horizontal timeline (PC view)
   */
  positionPointPC(point, index) {
    const xPosition = index * this.pointSpacing;
    point.style.left = xPosition + 'px';
  }

  /**
   * Position point along vertical timeline (mobile view)
   */
  positionPointMobile(point, index) {
    // Calculate vertical position based on viewport height
    const containerHeight = this.container.offsetHeight;
    const totalPoints = this.focusTargets.length;
    const spacing = containerHeight / (totalPoints + 1);
    const yPosition = (index + 1) * spacing;
    point.style.top = yPosition + 'px';
    point.style.left = '50%';
    point.style.transform = 'translate(-50%, -50%)';
  }

  calculateTrackLayout() {
    if (!this.track) return;

    if (!this.isPC) {
      this.track.style.width = 'auto';
      this.container.style.minHeight = 'auto';
      return;
    }

    const pointsCount = this.focusTargets.length;
    this.trackWidth = Math.max(
      (pointsCount - 1) * this.pointSpacing + this.edgeDotSize,
      window.innerWidth
    );

    this.track.style.width = this.trackWidth + 'px';
    this.startTranslation = window.innerWidth / 2;
    this.endTranslation = window.innerWidth / 2 - this.trackWidth;
    this.trackShiftRange = this.endTranslation - this.startTranslation;

    const baseScrollRange = Math.max(1, this.container.offsetHeight - window.innerHeight);
    this.startScroll = this.container.offsetTop + this.timelineDelay;
    this.endScroll = this.startScroll + baseScrollRange;
    this.container.style.minHeight = 'auto';
  }

  updateTrackTransform(progress) {
    if (!this.track || !this.isPC) return;

    const translation = this.startTranslation + this.trackShiftRange * progress;
    this.track.style.transform = `translateX(${translation}px)`;
    this.updateTimelineEdgeFade();
  }

  getScrollProgress() {
    if (!this.isPC) return 0;
    if (typeof this.startScroll !== 'number' || typeof this.endScroll !== 'number') return 0;

    const scrollTop = window.scrollY;
    if (scrollTop <= this.startScroll) return 0;
    if (scrollTop >= this.endScroll) return 1;

    const progress = (scrollTop - this.startScroll) / Math.max(1, this.endScroll - this.startScroll);
    return Math.min(1, Math.max(0, progress));
  }

  setupEventListeners() {
    if (this.isPC && !this.timelineAnimation) {
      // PC fallback: handle horizontal timeline without GSAP
      window.addEventListener('scroll', () => this.handlePCScroll());
    } else if (!this.isPC) {
      // Mobile: handle vertical scroll through points
      window.addEventListener('scroll', () => this.handleMobileScroll());
    }

    window.addEventListener('resize', () => this.handleResize());

    // Point click handlers
    this.focusTargets.forEach(point => {
      point.addEventListener('click', (e) => this.handlePointClick(e));
    });
  }

  handleResize() {
    const wasPC = this.isPC;
    this.isPC = window.innerWidth >= 768;
    
    this.focusTargets.forEach((point, index) => {
      this.isPC ? this.positionPointPC(point, index) : this.positionPointMobile(point, index);
    });
    this.calculateTrackLayout();

    if (this.timelineAnimation) {
      this.timelineAnimation.kill();
      this.initGSAP();
    } else {
      this.updateTrackTransform(this.getScrollProgress());
    }

    this.updateFocusedPoint();
    this.updateInfo();
  }

  handlePCScroll() {
    const progress = this.getScrollProgress();
    this.updateTrackTransform(progress);
    this.updateFocusedPointPC();
  }

  initGSAP() {
    gsap.registerPlugin(ScrollTrigger);
    const pinTarget = this.container.querySelector('.timeline-stage') || this.container;
    this.track.style.transform = `translateX(${this.startTranslation}px)`;
    this.track.style.willChange = 'transform';

    const extraScroll = this.timelineDelay;
    this.timelineAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: this.container,
        start: 'top 120px',
        end: `+=${this.trackWidth + extraScroll}`,
        scrub: true,
        pin: pinTarget,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: () => this.updateFocusedPointPC()
      }
    });

    this.timelineAnimation
      .to(this.track, { x: this.startTranslation, duration: extraScroll })
      .to(this.track, { x: this.endTranslation, duration: this.trackWidth });
  }

  handleMobileScroll() {
    // Determine which point is in focus based on scroll position
    this.updateFocusedPointMobile();
  }

  updateFocusedPointPC() {
    if (!this.track) return;

    const centerX = window.innerWidth / 2;
    
    let closest = 0;
    let closestDistance = Infinity;

    this.focusTargets.forEach((point, index) => {
      const pointRect = point.getBoundingClientRect();
      const pointCenterX = pointRect.left + pointRect.width / 2;
      const distance = Math.abs(pointCenterX - centerX);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });

    this.setFocusedPoint(closest);
  }

  updateFocusedPointMobile() {
    const centerY = window.innerHeight / 2;
    let closest = 0;
    let closestDistance = Infinity;

    this.focusTargets.forEach((point, index) => {
      const pointRect = point.getBoundingClientRect();
      const pointCenterY = pointRect.top + pointRect.height / 2;
      const distance = Math.abs(pointCenterY - centerY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });

    this.setFocusedPoint(closest);
  }

  setFocusedPoint(index) {
    if (index === this.currentFocusIndex) return;
    
    this.currentFocusIndex = index;
    this.updateFocusedPoint();
    this.updateInfo();
    this.updateMobileBackground();
  }

  updateFocusedPoint() {
    this.focusTargets.forEach((point, index) => {
      point.classList.remove('focused', 'minimized');
      
      if (index === this.currentFocusIndex) {
        point.classList.add('focused');
      } else {
        point.classList.add('minimized');
      }
    });
  }

  updateInfo() {
    const focusedPoint = this.focusTargets[this.currentFocusIndex];

    if (!focusedPoint || focusedPoint.classList.contains('timeline-edge-point')) {
      this.hideInfo();
      return;
    }

    const data = {
      date: focusedPoint.dataset.date || '',
      title: focusedPoint.dataset.title || '',
      image: focusedPoint.dataset.image || '',
      paragraph: focusedPoint.dataset.paragraph || ''
    };

    if (this.isPC) {
      this.updateInfoPC(data);
    } else {
      this.updateInfoMobile(data);
    }
  }

  updateInfoPC(data) {
    // Update text content
    const paragraph = this.infoSection.querySelector('.timeline-paragraph');
    const date = this.infoSection.querySelector('.timeline-date');
    const title = this.infoSection.querySelector('.timeline-title');
    const image = this.infoSection.querySelector('.timeline-image');

    if (paragraph) {
      paragraph.textContent = data.paragraph;
      paragraph.classList.add('visible');
    }

    if (date) {
      date.textContent = data.date;
    }

    if (title) {
      title.textContent = data.title;
      title.classList.add('visible');
    }

    if (image) {
      image.src = data.image;
      image.classList.add('visible');
    }

    this.infoSection.classList.remove('hidden');
  }

  updateInfoMobile(data) {
    const paragraph = this.infoSection.querySelector('.timeline-paragraph');
    const date = this.infoSection.querySelector('.timeline-date');

    if (paragraph) {
      paragraph.textContent = data.paragraph;
      paragraph.classList.add('visible');
    }

    if (date) {
      date.textContent = data.date;
    }

    this.infoSection.classList.remove('hidden');
  }

  hideInfo() {
    const allVisible = this.infoSection.querySelectorAll('.visible');
    allVisible.forEach(el => el.classList.remove('visible'));
    this.infoSection.classList.add('hidden');
  }

  updateMobileBackground() {
    if (this.isPC) return;

    const focusedPoint = this.focusTargets[this.currentFocusIndex];

    let bgElement = document.querySelector('.timeline-mobile-bg');
    
    if (!bgElement) {
      bgElement = document.createElement('div');
      bgElement.className = 'timeline-mobile-bg';
      document.body.appendChild(bgElement);
    }

    if (focusedPoint && focusedPoint.dataset.image) {
      bgElement.style.backgroundImage = `url('${focusedPoint.dataset.image}')`;
      bgElement.classList.add('visible');
    } else {
      bgElement.classList.remove('visible');
    }
  }

  updateTimelineEdgeFade() {
    if (!this.track) return;

    const trackRect = this.track.getBoundingClientRect();
    const leftEdgeVisible = trackRect.left >= window.innerWidth * 0.1;
    const rightEdgeVisible = trackRect.right <= window.innerWidth * 0.9;

    this.track.classList.toggle('left-edge-visible', leftEdgeVisible);
    this.track.classList.toggle('right-edge-visible', rightEdgeVisible);
  }

  handlePointClick(event) {
    const point = event.target.closest('.timeline-edge-point, .timeline-point');
    if (!point) return;

    const index = Array.from(this.focusTargets).indexOf(point);
    if (index === -1) return;

    this.setFocusedPoint(index);

    if (this.isPC) {
      const pointProgress = index / Math.max(1, this.focusTargets.length - 1);
      this.updateTrackTransform(pointProgress);
    }
  }
}

// Initialize timeline when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TimelineComponent();
  
  // Setup back button
  const backLink = document.querySelector('a[href="index.html"]');
  if (backLink) {
    const backButton = document.createElement('a');
    backButton.href = 'index.html';
    backButton.className = 'back-button';
    backButton.textContent = '← Back';
    document.body.appendChild(backButton);
  }
});
