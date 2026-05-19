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
    this.infoSection = this.container.querySelector('.timeline-info');
    this.isPC = window.innerWidth >= 768;
    
    this.currentFocusIndex = Math.max(0, Math.floor(this.points.length / 2) - 1);
    this.pointSpacing = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timeline-point-spacing'));
    this.transitionDuration = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--timeline-transition-duration')
        .replace('ms', '')
    );
    
    this.init();
  }

  init() {
    if (!this.track || this.points.length === 0) return;

    // Position points based on their order
    this.points.forEach((point, index) => {
      point.dataset.index = index;
      this.isPC ? this.positionPointPC(point, index) : this.positionPointMobile(point, index);
    });

    // Initialize event listeners
    this.setupEventListeners();
    
    // Initial state
    this.updateFocusedPoint();
    this.updateInfo();
    
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
    const totalPoints = this.points.length;
    const spacing = containerHeight / (totalPoints + 1);
    const yPosition = (index + 1) * spacing;
    point.style.top = yPosition + 'px';
  }

  setupEventListeners() {
    if (this.isPC) {
      // PC: handle scroll and horizontal timeline scrolling
      window.addEventListener('scroll', () => this.handlePCScroll());
      window.addEventListener('resize', () => this.handleResize());
    } else {
      // Mobile: handle vertical scroll through points
      window.addEventListener('scroll', () => this.handleMobileScroll());
      window.addEventListener('resize', () => this.handleResize());
    }

    // Point click handlers
    this.points.forEach(point => {
      point.addEventListener('click', (e) => this.handlePointClick(e));
    });
  }

  handleResize() {
    const wasPC = this.isPC;
    this.isPC = window.innerWidth >= 768;
    
    // If viewport changed from PC to mobile or vice versa, reinitialize
    if (wasPC !== this.isPC) {
      this.points.forEach((point, index) => {
        this.isPC ? this.positionPointPC(point, index) : this.positionPointMobile(point, index);
      });
      this.updateFocusedPoint();
      this.updateInfo();
    }
  }

  handlePCScroll() {
    const hero = document.querySelector('.hero-page');
    if (!hero) return;

    const heroRect = hero.getBoundingClientRect();
    const heroBottom = heroRect.bottom;
    const windowHeight = window.innerHeight;

    // Phase 1: Background image fades as you scroll past hero
    if (heroBottom > 0) {
      const heroSection = document.querySelector('.hero-page');
      if (heroSection) {
        const scrollProgress = Math.max(0, 1 - (heroBottom / windowHeight));
        heroSection.classList.toggle('scrolled', scrollProgress > 0.3);
      }
    }

    // Phase 2: Once hero is off screen, start horizontal timeline scrolling
    if (heroBottom <= 0) {
      const containerRect = this.container.getBoundingClientRect();
      const centerY = windowHeight / 2;
      
      // Calculate how far past the timeline top we are
      const distanceBelowCenter = containerRect.top - centerY;
      
      // Only scroll horizontally if timeline is roughly centered
      if (Math.abs(distanceBelowCenter) < windowHeight * 0.3) {
        // Scroll amount increases as distance from center increases
        const scrollAmount = Math.max(0, Math.abs(distanceBelowCenter) * 1.5);
        
        this.track.style.transform = `translateX(-${scrollAmount}px)`;
        this.updateTimelineEdgeFade();
      }
    }

    // Update focused point based on which point is in the center
    this.updateFocusedPointPC();
  }

  handleMobileScroll() {
    // Determine which point is in focus based on scroll position
    this.updateFocusedPointMobile();
  }

  updateFocusedPointPC() {
    if (!this.track) return;

    const trackRect = this.track.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    
    let closest = 0;
    let closestDistance = Infinity;

    this.points.forEach((point, index) => {
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

    this.points.forEach((point, index) => {
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
    this.points.forEach((point, index) => {
      point.classList.remove('focused', 'minimized');
      
      // Edge points (first and last) should not expand
      const isEdgePoint = index === 0 || index === this.points.length - 1;
      
      if (index === this.currentFocusIndex && !isEdgePoint) {
        point.classList.add('focused');
      } else {
        point.classList.add('minimized');
      }
    });
  }

  updateInfo() {
    const focusedPoint = this.points[this.currentFocusIndex];
    const isEdgePoint = 
      this.currentFocusIndex === 0 || 
      this.currentFocusIndex === this.points.length - 1;

    if (!focusedPoint || isEdgePoint) {
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

    const focusedPoint = this.points[this.currentFocusIndex];
    const isEdgePoint = 
      this.currentFocusIndex === 0 || 
      this.currentFocusIndex === this.points.length - 1;

    let bgElement = document.querySelector('.timeline-mobile-bg');
    
    if (!bgElement) {
      bgElement = document.createElement('div');
      bgElement.className = 'timeline-mobile-bg';
      document.body.appendChild(bgElement);
    }

    if (focusedPoint && !isEdgePoint && focusedPoint.dataset.image) {
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
    const point = event.target.closest('.timeline-point');
    if (!point) return;

    const index = Array.from(this.points).indexOf(point);
    this.setFocusedPoint(index);

    // On PC, scroll to make the point more centered
    if (this.isPC) {
      const targetX = index * this.pointSpacing - window.innerWidth / 2;
      this.track.style.transform = `translateX(-${targetX}px)`;
      this.updateTimelineEdgeFade();
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
