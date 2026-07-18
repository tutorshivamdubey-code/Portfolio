/* =========================================
   MAIN JS (Full-Stack CMS Integration)
   ========================================= */

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

document.addEventListener('DOMContentLoaded', () => {
  /* --- Theme Engine --- */
  let currentTheme = 'dark';
  window.dbThemeLight = '';
  window.dbThemeDark = '';
  
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeCssTag = document.getElementById('theme-css');

  window.applyTheme = function(theme) {
    currentTheme = theme;
    localStorage.setItem('user-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'light' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
      if (window.lucide) {
        lucide.createIcons({
          attrs: { width: 20, height: 20 }
        });
      }
    }
    if (themeCssTag) {
      if (theme === 'light') {
        themeCssTag.innerHTML = window.dbThemeLight || `:root {
          --clr-bg: #FAF8F5;
          --clr-surface-alt: #F3EFE9;
          --clr-surface: #FFFFFF;
          --clr-primary: #7A1F2B;
          --clr-accent: #9B2C3C;
          --clr-text: #1C1B1A;
          --clr-body-text: #4F4A46;
          --clr-muted: #7B746D;
          --clr-border: #E6DDD4;
        }`; // Harvard Theme fallback
      } else {
        themeCssTag.innerHTML = window.dbThemeDark || ''; // Empty defaults to base.css vars
      }
    }
  };

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('user-theme');
  
  if (savedTheme) {
    window.applyTheme(savedTheme);
  } else {
    window.applyTheme(prefersDark ? 'dark' : 'light');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      window.applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
  }
  /* --- Mobile Menu Toggle --- */
  const toggleBtn = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__menu');

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('is-active');
      menu.classList.toggle('is-active');
    });

    const links = document.querySelectorAll('.navbar__link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        toggleBtn.classList.remove('is-active');
        menu.classList.remove('is-active');
      });
    });
  }

  /* --- Dynamic Year in Footer --- */
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  /* --- FAQ Accordion --- */
  window.initFaqAccordion = function() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if(question && answer) {
        // Remove existing listener if any to avoid duplicates
        const newQuestion = question.cloneNode(true);
        question.parentNode.replaceChild(newQuestion, question);
        
        newQuestion.addEventListener('click', () => {
          const isActive = item.classList.contains('is-active');
          faqItems.forEach(otherItem => {
            otherItem.classList.remove('is-active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
          });
          if (!isActive) {
            item.classList.add('is-active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        });
      }
    });
  };
  window.initFaqAccordion();

  /* --- Star Rating Logic --- */
  const stars = document.querySelectorAll('#starRating span');
  let currentRating = 0;

  stars.forEach((star, index) => {
    star.addEventListener('mouseover', () => { highlightStars(index + 1); });
    star.addEventListener('mouseout', () => { highlightStars(currentRating); });
    star.addEventListener('click', () => {
      currentRating = parseInt(star.getAttribute('data-value'));
      highlightStars(currentRating);
    });
  });

  function highlightStars(count) {
    stars.forEach((s, i) => {
      s.style.color = (i < count) ? 'var(--clr-accent)' : 'var(--clr-muted)';
      const svg = s.querySelector('svg');
      if (svg) {
        svg.style.fill = (i < count) ? 'currentColor' : 'transparent';
      }
    });
  }

  /* --- Feedback Form Submission --- */
  const feedbackForm = document.getElementById('feedbackForm');
  const testimonialsGrid = document.getElementById('testimonialsGrid');
  
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (currentRating === 0) return alert("Please select a star rating.");

      const testimonialData = {
        id: 'test_' + new Date().getTime(),
        name: document.getElementById('name').value,
        student: document.getElementById('student').value,
        grade: document.getElementById('grade').value,
        subject: document.getElementById('subject').value,
        feedback: document.getElementById('feedback').value,
        rating: currentRating,
        timestamp: new Date().getTime()
      };

      try {
        await fetch(`${API_BASE}/testimonials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testimonialData)
        });
        injectTestimonial(testimonialData);
        if (window.initTestimonialsViewMore) window.initTestimonialsViewMore();
        document.getElementById('feedbackSuccess').style.display = 'block';
        feedbackForm.reset();
        currentRating = 0;
        highlightStars(0);
        setTimeout(() => document.getElementById('feedbackSuccess').style.display = 'none', 4000);
      } catch (err) {
        console.error('Failed to submit testimonial', err);
      }
    });
  }

  function injectTestimonial(data) {
    if (!testimonialsGrid) return;
    const starsHtml = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
    const card = document.createElement('div');
    card.className = 'card card--testimonial animate-up';
    card.style.opacity = '1'; 
    card.style.transform = 'translateY(0)';
    card.style.position = 'relative'; // For absolute admin buttons
    
    const studentStr = data.student ? ` (Parent of ${data.student})` : '';
    const detailsStr = (data.grade && data.subject) ? ` · ${data.grade} (${data.subject})` : '';

    card.innerHTML = `
      <div class="stars">${starsHtml}</div>
      <p class="quote">"${data.feedback}"</p>
      <p class="author">— ${data.name}${studentStr}${detailsStr}</p>
    `;

    // Admin controls for editing/deleting testimonials
    const adminControls = document.createElement('div');
    adminControls.className = 'admin-card-del'; // Reusing this class for display logic
    adminControls.style.display = isAdmin ? 'flex' : 'none';
    adminControls.style.position = 'absolute';
    adminControls.style.top = '10px';
    adminControls.style.right = '10px';
    adminControls.style.gap = '8px';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--secondary btn--small';
    editBtn.innerHTML = '✎';
    editBtn.style.padding = '4px 8px';
    editBtn.onclick = () => window.editTestimonial(data.id, data.feedback);

    const delBtn = document.createElement('button');
    delBtn.className = 'admin-delete-btn';
    delBtn.innerHTML = '×';
    delBtn.style.position = 'static'; // Override default absolute
    delBtn.onclick = () => window.deleteTestimonial(data.id);

    adminControls.appendChild(editBtn);
    adminControls.appendChild(delBtn);
    card.appendChild(adminControls);

    testimonialsGrid.prepend(card);
    testimonialsGrid.scrollTo({ left: 0, behavior: 'smooth' });
  }

  // Global functions for testimonial actions
  window.editTestimonial = async (id, currentText) => {
    const newText = prompt("Edit Testimonial:", currentText);
    if (newText !== null && newText.trim() !== "") {
      try {
        await fetch(`${API_BASE}/testimonials/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ feedback: newText.trim() })
        });
        loadDataFromBackend(); // Refresh all
      } catch (err) {
        alert("Failed to update testimonial.");
      }
    }
  };

  window.deleteTestimonial = async (id) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      try {
        await fetch(`${API_BASE}/testimonials/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
        });
        loadDataFromBackend(); // Refresh all
      } catch (err) {
        alert("Failed to delete testimonial.");
      }
    }
  };

  /* --- Testimonials View More Logic --- */
  const testimonialViewMoreBtn = document.getElementById('testimonialViewMoreBtn');
  const testimonialViewLessBtn = document.getElementById('testimonialViewLessBtn');
  
  window.initTestimonialsViewMore = function() {
    if (!testimonialsGrid || !testimonialViewMoreBtn || !testimonialViewLessBtn) return;
    
    const cards = Array.from(testimonialsGrid.querySelectorAll('.card'));
    let maxVisible = window.innerWidth <= 768 ? 2 : 3;
    
    if (cards.length > maxVisible) {
      cards.forEach((card, index) => {
        if (index >= maxVisible) {
          card.classList.add('hidden-testimonial');
          card.style.display = 'none';
        } else {
          card.classList.remove('hidden-testimonial');
          card.style.display = 'block';
        }
      });
      
      testimonialViewMoreBtn.style.display = 'inline-block';
      testimonialViewLessBtn.style.display = 'none';
      
      testimonialViewMoreBtn.onclick = () => {
        cards.forEach(card => {
          card.classList.remove('hidden-testimonial');
          card.style.display = 'block';
        });
        testimonialViewMoreBtn.style.display = 'none';
        testimonialViewLessBtn.style.display = 'inline-block';
      };

      testimonialViewLessBtn.onclick = () => {
        cards.forEach((card, index) => {
          if (index >= maxVisible) {
            card.classList.add('hidden-testimonial');
            card.style.display = 'none';
          }
        });
        testimonialViewLessBtn.style.display = 'none';
        testimonialViewMoreBtn.style.display = 'inline-block';
        
        // Optional: scroll back to top of testimonials section
        const testimonialsSection = document.getElementById('testimonials');
        if (testimonialsSection) {
          testimonialsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    } else {
      testimonialViewMoreBtn.style.display = 'none';
      testimonialViewLessBtn.style.display = 'none';
      cards.forEach(card => {
        card.classList.remove('hidden-testimonial');
        card.style.display = 'block';
      });
    }
  };
  
  window.addEventListener('resize', () => {
    // Only re-init if the button is still supposed to be visible
    if(testimonialViewMoreBtn && testimonialViewMoreBtn.style.display !== 'none') {
        window.initTestimonialsViewMore();
    }
  });

  /* =========================================
     BACKEND SYNC LOGIC
     ========================================= */
  
  async function loadDataFromBackend() {
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (!res.ok) throw new Error('Backend not reachable');
      const data = await res.json();
      
      // Hydrate Text Content
      if (data.content) {
        for (const [key, val] of Object.entries(data.content)) {
          const textEl = document.querySelector(`[data-editable="${key}"]`);
          if (textEl) textEl.innerHTML = val;
          const linkEl = document.querySelector(`[data-editable-link="${key}"]`);
          if (linkEl) linkEl.href = val;
          const imgEl = document.querySelector(`[data-editable-image="${key}"]`);
          if (imgEl) {
            imgEl.src = val;
            imgEl.style.display = 'block';
            const placeholder = imgEl.parentElement.querySelector('.placeholder-box');
            if (placeholder) placeholder.style.display = 'none';
          }
        }
        
        // Hide disabled sections
        document.querySelectorAll('section').forEach(sec => {
          if (sec.id && data.content[`hide_section_${sec.id}`] === 'true') {
            sec.style.display = 'none';
          } else {
            sec.style.display = ''; // Reset display
          }
        });
        
        // Restore custom portrait if exists
        const heroPortrait = document.getElementById('heroPortrait');
        if (data.content['heroPortraitSrc'] && heroPortrait) {
          heroPortrait.src = data.content['heroPortraitSrc'];
        }
        
        // Hydrate Global Custom Styles
        const customCssStyle = document.getElementById('admin-custom-css');
        if (customCssStyle && data.content['global_custom_css']) {
          customCssStyle.innerHTML = data.content['global_custom_css'];
        }
        
        // Hydrate Themes
        if (data.content['theme_light_css']) {
          window.dbThemeLight = data.content['theme_light_css'];
        }
        if (data.content['theme_dark_css']) {
          window.dbThemeDark = data.content['theme_dark_css'];
        }
        // Re-apply current theme to inject DB variables
        const savedTheme = localStorage.getItem('user-theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        window.applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
      }

      // Hydrate Testimonials
      if (data.testimonials && data.testimonials.length > 0) {
        if(testimonialsGrid) testimonialsGrid.innerHTML = ''; // clear static
        data.testimonials.reverse().forEach(t => injectTestimonial(t));
        if(window.initTestimonialsViewMore) window.initTestimonialsViewMore();
      }

      // Hydrate Gallery
      if (data.gallery) {
        renderGallery(data.gallery, data.content);
      }
      
      // Hydrate Dynamic Sections
      if (data.dynamicSections) {
        renderDynamicSections(data.dynamicSections);
      }
      
    } catch (err) {
      console.log('Running in static mode. Start Node server for CMS features.');
    }
  }

  const galleryGridTarget = document.getElementById('galleryGridTarget');
  const adminGalleryAdd = document.getElementById('adminGalleryAdd');
  const viewMoreBtn = document.getElementById('galleryViewMoreBtn');
  
  function renderGallery(images, dataContent = {}) {
    if (!galleryGridTarget) return;
    
    // Remove old items except the Add button
    Array.from(galleryGridTarget.children).forEach(child => {
      if (child.id !== 'adminGalleryAdd') child.remove();
    });

    images.forEach((img, index) => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.setAttribute('data-id', img.id);
      
      // Hide images beyond the first 6
      if (index >= 6) {
        div.style.display = 'none';
        div.classList.add('gallery-hidden');
      }

      const capKey = 'galleryCap' + (index + 1);
      const capText = dataContent[capKey] || 'Parent feedback image';

      div.innerHTML = `
        <img src="${img.src}" alt="Gallery Image" class="gallery-img">
        <p class="gallery-caption" data-editable="${capKey}">${capText}</p>
      `;
      
      if (isAdmin) {
        addAdminGalleryControls(div, img.id);
      }
      
      galleryGridTarget.insertBefore(div, adminGalleryAdd);
    });

    // Handle View More button
    if (images.length > 6) {
      viewMoreBtn.style.display = 'inline-block';
      viewMoreBtn.onclick = () => {
        document.querySelectorAll('.gallery-hidden').forEach(el => {
          el.style.display = 'block';
        });
        viewMoreBtn.style.display = 'none';
      };
    } else {
      if(viewMoreBtn) viewMoreBtn.style.display = 'none';
    }
  }

  function addAdminGalleryControls(itemDiv, id) {
    const controls = document.createElement('div');
    controls.className = 'admin-gallery-controls';
    controls.innerHTML = `
      <label class="admin-replace-btn" title="Replace Photo">🔄
        <input type="file" accept="image/*" style="display:none;" onchange="replaceGalleryImage(event, '${id}')">
      </label>
      <button class="admin-delete-btn" onclick="deleteGalleryImage('${id}')">×</button>
    `;
    itemDiv.appendChild(controls);
  }

  window.replaceGalleryImage = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      try {
        await fetch(`${API_BASE}/gallery`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ id, src: dataUrl })
        });
        loadDataFromBackend(); // Refresh gallery
      } catch (err) { console.error(err); }
    };
    reader.readAsDataURL(file);
  };

  window.deleteGalleryImage = async (id) => {
    if (confirm('Delete this image?')) {
      try {
        await fetch(`${API_BASE}/gallery/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
        });
        loadDataFromBackend();
      } catch (err) { console.error(err); }
    }
  };

  /* =========================================
     ADMIN MODE LOGIC
     ========================================= */
  let isAdmin = sessionStorage.getItem('isAdminActive') === 'true'; // Using session storage for login state
  let isEditingMode = false;

  const adminLoginLink = document.getElementById('adminLoginLink');
  const adminLoginModal = document.getElementById('adminLoginModal');
  const adminPassword = document.getElementById('adminPassword');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminCancelBtn = document.getElementById('adminCancelBtn');
  const adminPanel = document.getElementById('adminPanel');
  const adminExit = document.getElementById('adminExit');
  const adminToggleVisual = document.getElementById('adminToggleVisual');
  const adminSaveChanges = document.getElementById('adminSaveChanges');
  const heroPortrait = document.getElementById('heroPortrait');
  const adminPhotoEdit = document.getElementById('adminPhotoEdit');
  const galleryUpload = document.getElementById('galleryUpload');

  // Initial Load
  loadDataFromBackend().then(() => {
    if (isAdmin) enableAdminMode();
  });

  const adminTrigger = document.getElementById('adminTrigger');

  if (adminLoginLink) {
    adminLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isAdmin) adminLoginModal.showModal();
    });
  }

  if (adminTrigger) {
    adminTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isAdmin) adminLoginModal.showModal();
    });
  }

  if (adminCancelBtn) {
    adminCancelBtn.addEventListener('click', () => {
      adminLoginModal.close();
      adminPassword.value = '';
    });
  }

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', async () => {
      const pwd = adminPassword.value;
      if (!pwd) return alert('Enter password');
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();
        if (data.success) {
          isAdmin = true;
          sessionStorage.setItem('isAdminActive', 'true');
          sessionStorage.setItem('adminToken', data.token);
          adminLoginModal.close();
          adminPassword.value = '';
          enableAdminMode();
        } else {
          alert(data.error || 'Incorrect Password');
        }
      } catch (err) {
        alert('Login failed. Server error.');
      }
    });
  }

  if (adminExit) {
    adminExit.addEventListener('click', () => {
      if (isEditingMode) toggleVisualEditor();
      isAdmin = false;
      sessionStorage.setItem('isAdminActive', 'false');
      sessionStorage.removeItem('adminToken');
      disableAdminMode();
    });
  }

  const adminUpdatePwdBtn = document.getElementById('adminUpdatePwdBtn');
  const updatePasswordModal = document.getElementById('updatePasswordModal');
  const updatePasswordForm = document.getElementById('updatePasswordForm');
  const updatePwdCancel = document.getElementById('updatePwdCancel');

  if (adminUpdatePwdBtn && updatePasswordModal) {
    adminUpdatePwdBtn.addEventListener('click', () => updatePasswordModal.showModal());
  }

  if (updatePwdCancel && updatePasswordModal) {
    updatePwdCancel.addEventListener('click', () => {
      updatePasswordModal.close();
      if (updatePasswordForm) updatePasswordForm.reset();
    });
  }

  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('oldPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      if (newPassword !== confirmPassword) return alert('New passwords do not match!');
      try {
        const token = sessionStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE}/update-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
          alert('Password updated successfully!');
          updatePasswordModal.close();
          updatePasswordForm.reset();
        } else {
          alert(data.error || 'Failed to update password');
        }
      } catch (err) { alert('Server error'); }
    });
  }

  /* --- Admin Editor UI Logic --- */
  function toggleLinkEditors(show) {
    document.querySelectorAll('.admin-link-edit').forEach(el => el.remove());
    if (show) {
      document.querySelectorAll('[data-editable-link]').forEach(el => {
        const btn = document.createElement('button');
        btn.className = 'admin-link-edit btn btn--primary btn--small';
        btn.innerHTML = '🔗';
        btn.style.position = 'absolute';
        btn.style.top = '-10px';
        btn.style.right = '-20px';
        btn.style.width = '24px';
        btn.style.height = '24px';
        btn.style.padding = '0';
        btn.style.fontSize = '12px';
        btn.style.borderRadius = '50%';
        btn.style.zIndex = '100';
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newUrl = prompt('Enter new URL for this link:', el.href);
          if (newUrl !== null && newUrl.trim() !== '') {
            el.href = newUrl.trim();
            try {
              await fetch(`${API_BASE}/content`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ [el.dataset.editableLink]: newUrl.trim() })
              });
              alert('Link saved successfully!');
            } catch (err) {
              console.error(err);
              alert('Error saving link.');
            }
          }
        };
        el.appendChild(btn);
      });
    }
  }

  if (adminToggleVisual) adminToggleVisual.addEventListener('click', toggleVisualEditor);

  const textFormatToolbar = document.getElementById('textFormatToolbar');
  const textColorPicker = document.getElementById('textColorPicker');
  const adminAddSection = document.getElementById('adminAddSection');

  window.applyAdminUI = function() {
    if (!isEditingMode) return;
    
    // Inject Delete UI and Builder Toolbar for sections
    document.querySelectorAll('section').forEach(sec => {
      if (!sec.id) return;
      // Don't inject on dynamic sections that already have their own delete button
      if (sec.classList.contains('custom-page-section')) {
         const btn = sec.querySelector('.admin-section-del');
         if(btn) btn.style.display = 'inline-flex';
         
         // Inject Freeform Section Builder Toolbar
         let builderBar = sec.querySelector('.admin-section-builder');
         if (!builderBar) {
           builderBar = document.createElement('div');
           builderBar.className = 'admin-section-builder';
           builderBar.style.position = 'absolute';
           builderBar.style.top = '20px';
           builderBar.style.left = '20px';
           builderBar.style.display = 'flex';
           builderBar.style.gap = '8px';
           builderBar.style.zIndex = '100';
           
           // Setup Drag and Drop Function
           if (!window.makeDraggable) {
             window.makeDraggable = function(el) {
               if (el.classList.contains('is-draggable')) return;
               el.classList.add('is-draggable');
               
               let isDragging = false;
               let startX, startY, initialX, initialY;
               
               el.addEventListener('mousedown', (e) => {
                 if (!isEditingMode) return;
                 if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
                 if (e.target.closest('.admin-img-upload-btn') || e.target.closest('button')) return;

                 isDragging = true;
                 startX = e.clientX;
                 startY = e.clientY;
                 
                 const rect = el.getBoundingClientRect();
                 const parentRect = el.parentElement.getBoundingClientRect();
                 
                 if (window.getComputedStyle(el).position !== 'absolute') {
                    el.style.position = 'absolute';
                    el.style.left = (rect.left - parentRect.left) + 'px';
                    el.style.top = (rect.top - parentRect.top) + 'px';
                    el.style.margin = '0';
                 }
                 
                 initialX = parseFloat(el.style.left) || 0;
                 initialY = parseFloat(el.style.top) || 0;
                 el.style.zIndex = '1000';
                 e.preventDefault(); // Prevent text selection while dragging
               });
               
               function onMouseMove(e) {
                if (!isDragging || !isEditingMode) return;
                 const dx = e.clientX - startX;
                 const dy = e.clientY - startY;
                 el.style.left = (initialX + dx) + 'px';
                 el.style.top = (initialY + dy) + 'px';
               }
               
               function onMouseUp() {
                 if (isDragging) {
                   isDragging = false;
                   el.style.zIndex = '';
                   
                   // Convert inline position to CSS rule so it respects Mobile Mode
                   let selector = '';
                   if (el.id) {
                     selector = `#${el.id}`;
                   } else {
                     if (!el.hasAttribute('data-style-id')) {
                       el.setAttribute('data-style-id', 'styled_' + Date.now());
                     }
                     selector = `[data-style-id="${el.getAttribute('data-style-id')}"]`;
                   }
                   
                   const customCssStyle = document.getElementById('admin-custom-css');
                   if (customCssStyle) {
                     const leftVal = el.style.left;
                     const topVal = el.style.top;
                     // We leave inline styles intact for immediate feedback, but also inject them as CSS rules to save them
                     if (window.isMobileMode) {
                       customCssStyle.innerHTML += `@media (max-width: 768px) { ${selector} { left: ${leftVal} !important; top: ${topVal} !important; } }\n`;
                     } else {
                       customCssStyle.innerHTML += `${selector} { left: ${leftVal} !important; top: ${topVal} !important; }\n`;
                     }
                   }
                 }
               }

               document.addEventListener('mousemove', onMouseMove);
               document.addEventListener('mouseup', onMouseUp);
             };
           }
           
           const toggleMobileBtn = document.createElement('button');
           toggleMobileBtn.className = 'btn btn--outline';
           toggleMobileBtn.innerHTML = 'Mobile Mode';
           toggleMobileBtn.onclick = () => {
             isMobileMode = !isMobileMode;
             window.isMobileMode = isMobileMode;
             toggleMobileBtn.style.background = isMobileMode ? 'var(--clr-primary)' : '';
           };
           
           const addHeadingBtn = document.createElement('button');
           addHeadingBtn.className = 'btn btn--outline';
           addHeadingBtn.style.padding = '4px 12px';
           addHeadingBtn.style.fontSize = '0.8rem';
           addHeadingBtn.innerHTML = '+ Heading';
           addHeadingBtn.onclick = () => {
             const cid = 'el_' + Date.now();
             const el = document.createElement('h2');
             el.className = 'section__title';
             el.setAttribute('data-editable', cid);
             el.setAttribute('contenteditable', 'true');
             el.innerHTML = 'New Heading';
             const container = sec.querySelector('.container') || sec;
             container.appendChild(el);
             window.makeDraggable(el);
           };
           
           const addParaBtn = document.createElement('button');
           addParaBtn.className = 'btn btn--outline';
           addParaBtn.style.padding = '4px 12px';
           addParaBtn.style.fontSize = '0.8rem';
           addParaBtn.innerHTML = '+ Text';
           addParaBtn.onclick = () => {
             const cid = 'el_' + Date.now();
             const el = document.createElement('p');
             el.setAttribute('data-editable', cid);
             el.setAttribute('contenteditable', 'true');
             el.style.color = 'var(--clr-muted)';
             el.innerHTML = 'New paragraph block. Click to edit.';
             const container = sec.querySelector('.container') || sec;
             container.appendChild(el);
             window.makeDraggable(el);
           };

           const addBtnBtn = document.createElement('button');
           addBtnBtn.className = 'btn btn--outline';
           addBtnBtn.style.padding = '4px 12px';
           addBtnBtn.style.fontSize = '0.8rem';
           addBtnBtn.innerHTML = '+ Button';
           addBtnBtn.onclick = () => {
             const cid = 'el_' + Date.now();
             const el = document.createElement('a');
             el.href = '#';
             el.className = 'btn btn--primary';
             el.setAttribute('data-editable', cid);
             el.setAttribute('data-editable-link', 'link_' + cid);
             el.setAttribute('contenteditable', 'true');
             el.innerHTML = 'Action Button';
             const container = sec.querySelector('.container') || sec;
             container.appendChild(el);
             window.makeDraggable(el);
             if (typeof toggleLinkEditors === 'function') toggleLinkEditors(true);
           };
           
           const addImgBtn = document.createElement('button');
           addImgBtn.className = 'btn btn--outline';
           addImgBtn.style.padding = '4px 12px';
           addImgBtn.style.fontSize = '0.8rem';
           addImgBtn.innerHTML = '+ Image';
           addImgBtn.onclick = () => {
             const cid = 'img_' + Date.now();
             const el = document.createElement('div');
             el.className = 'custom-image-wrapper placeholder-img';
             el.innerHTML = `
               <img src="" style="width:100%; height:100%; object-fit:cover; display:none;" data-editable-image="${cid}">
               <div class="placeholder-box">
                 <span style="color:var(--clr-muted);">Image Placeholder</span>
               </div>
             `;
             const container = sec.querySelector('.container') || sec;
             container.appendChild(el);
             window.makeDraggable(el);
             window.applyAdminUI();
           };
           
           const addSliderBtn = document.createElement('button');
           addSliderBtn.className = 'btn btn--outline';
           addSliderBtn.style.padding = '4px 12px';
           addSliderBtn.style.fontSize = '0.8rem';
           addSliderBtn.innerHTML = '+ Slider';
           addSliderBtn.onclick = () => {
             const el = document.createElement('div');
             el.className = 'custom-slider-container';
             el.innerHTML = '<p style="color:var(--clr-muted); margin:auto;">Slider Container: Drag elements inside here</p>';
             const container = sec.querySelector('.container') || sec;
             container.appendChild(el);
             window.makeDraggable(el);
           };
           
           const saveLayoutBtn = document.createElement('button');
           saveLayoutBtn.className = 'btn btn--secondary';
           saveLayoutBtn.style.padding = '4px 12px';
           saveLayoutBtn.style.fontSize = '0.8rem';
           saveLayoutBtn.innerHTML = 'Save Layout';
           saveLayoutBtn.onclick = () => window.saveCustomLayout(sec.id);
           
           builderBar.appendChild(addHeadingBtn);
           builderBar.appendChild(addParaBtn);
           builderBar.appendChild(addBtnBtn);
           builderBar.appendChild(addImgBtn);
           builderBar.appendChild(addSliderBtn);
           builderBar.appendChild(saveLayoutBtn);
           sec.appendChild(builderBar);
         } else {
           builderBar.style.display = 'flex';
         }
         
         // Inject Mobile Guideline
         let mobileGuide = sec.querySelector('.admin-mobile-guide');
         const container = sec.querySelector('.container') || sec;
         container.style.position = 'relative';
         if (!mobileGuide) {
           mobileGuide = document.createElement('div');
           mobileGuide.className = 'admin-mobile-guide';
           mobileGuide.style.position = 'absolute';
           mobileGuide.style.top = '0';
           mobileGuide.style.left = '50%';
           mobileGuide.style.transform = 'translateX(-50%)';
           mobileGuide.style.width = '375px';
           mobileGuide.style.height = '100%';
           mobileGuide.style.minHeight = '300px';
           mobileGuide.style.borderLeft = '2px dashed rgba(255, 100, 100, 0.4)';
           mobileGuide.style.borderRight = '2px dashed rgba(255, 100, 100, 0.4)';
           mobileGuide.style.pointerEvents = 'none';
           mobileGuide.style.zIndex = '0';
           
           const label = document.createElement('div');
           label.innerHTML = 'Mobile Safe Zone (375px)';
           label.style.position = 'absolute';
           label.style.top = '10px';
           label.style.left = '10px';
           label.style.color = 'rgba(255,100,100,0.6)';
           label.style.fontSize = '0.75rem';
           mobileGuide.appendChild(label);
           
           container.appendChild(mobileGuide);
         } else {
           mobileGuide.style.display = 'block';
         }
         
         // Make existing elements draggable
         Array.from(container.children).forEach(child => {
           if (child.classList && !child.classList.contains('admin-mobile-guide')) {
             if (window.makeDraggable) window.makeDraggable(child);
           }
         });
         
         return;
      }
      
      let delBtn = sec.querySelector('.hardcoded-section-del');
      if (!delBtn) {
        delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del hardcoded-section-del';
        delBtn.innerHTML = '× Hide Section';
        delBtn.style.display = 'inline-flex';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '20px';
        delBtn.style.right = '20px';
        delBtn.style.padding = '4px 12px';
        delBtn.style.fontSize = '0.9rem';
        delBtn.style.borderRadius = '4px';
        delBtn.style.zIndex = '100';
        delBtn.onclick = async () => {
           if(confirm(`Hide the ${sec.id} section?`)) {
             try {
               await fetch(`${API_BASE}/content`, {
                 method: 'POST',
                 headers: { 
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
                 },
                 body: JSON.stringify({ [`hide_section_${sec.id}`]: 'true' })
               });
               sec.style.display = 'none';
             } catch (err) { alert('Failed to hide section'); }
           }
        };
        sec.style.position = 'relative';
        sec.appendChild(delBtn);
      } else {
        delBtn.style.display = 'inline-flex';
      }
    });
    
    // Inject Replace Image buttons on editable images
    document.querySelectorAll('.custom-image-wrapper').forEach(wrapper => {
      let uploadLabel = wrapper.querySelector('.admin-img-upload-btn');
      if (!uploadLabel) {
        const imgEl = wrapper.querySelector('[data-editable-image]');
        if (!imgEl) return;
        const imageId = imgEl.getAttribute('data-editable-image');
        
        uploadLabel = document.createElement('label');
        uploadLabel.className = 'btn btn--primary admin-img-upload-btn';
        uploadLabel.innerHTML = `
          Replace Image
          <input type="file" accept="image/*" style="display:none;" onchange="window.uploadSectionImage(event, '${imageId}')">
        `;
        uploadLabel.style.position = 'absolute';
        uploadLabel.style.top = '10px';
        uploadLabel.style.right = '10px';
        uploadLabel.style.padding = '4px 12px';
        uploadLabel.style.fontSize = '0.8rem';
        uploadLabel.style.cursor = 'pointer';
        uploadLabel.style.zIndex = '100';
        wrapper.appendChild(uploadLabel);
      } else {
        uploadLabel.style.display = 'inline-block';
      }
    });
  };

  function toggleVisualEditor() {
    isEditingMode = !isEditingMode;
    const editables = document.querySelectorAll('[data-editable]');
    
    if (isEditingMode) {
      adminToggleVisual.textContent = 'Cancel Editing';
      adminSaveChanges.style.display = 'inline-block';
      
      // Text logic
      if (adminAddSection) adminAddSection.style.display = 'block';
      editables.forEach(el => {
        if (el.tagName !== 'SELECT') el.setAttribute('contenteditable', 'true');
      });
      toggleLinkEditors(true);
      document.addEventListener('selectionchange', handleTextSelection);
      window.applyAdminUI();
      
      // Style logic
      adminStyleEditor.style.display = 'flex';
      document.body.classList.add('style-editor-active');
      initStylePickers();
      
    } else {
      adminToggleVisual.textContent = 'Enable Visual Editor';
      adminSaveChanges.style.display = 'none';
      
      // Text logic
      if (adminAddSection) adminAddSection.style.display = 'none';
      editables.forEach(el => {
        if (el.tagName !== 'SELECT') el.removeAttribute('contenteditable');
      });
      toggleLinkEditors(false);
      document.removeEventListener('selectionchange', handleTextSelection);
      if(textFormatToolbar) textFormatToolbar.style.display = 'none';
      document.querySelectorAll('.admin-section-del, .hardcoded-section-del, .admin-section-builder, .admin-img-upload-btn, .admin-mobile-guide').forEach(btn => btn.style.display = 'none');
      
      // Style logic
      adminStyleEditor.style.display = 'none';
      document.body.classList.remove('style-editor-active');
      if(universalStyleInspector) universalStyleInspector.style.display = 'none';
      if(adminHighlightBox) adminHighlightBox.style.display = 'none';
      inspectorFrozen = false;
      currentStyleTarget = null;
      
      loadDataFromBackend(); // Revert unsaved text and styles
    }
  }

  function handleTextSelection() {
    if (!isEditingMode || !textFormatToolbar) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      // Check if selection is inside an editable element
      let node = selection.anchorNode;
      let isEditable = false;
      while (node) {
        if (node.nodeType === 1 && node.getAttribute('contenteditable') === 'true') {
          isEditable = true;
          break;
        }
        node = node.parentNode;
      }

      if (isEditable) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        textFormatToolbar.style.display = 'flex';
        textFormatToolbar.style.top = (rect.top + window.scrollY - 40) + 'px';
        textFormatToolbar.style.left = (rect.left + window.scrollX + (rect.width / 2) - (textFormatToolbar.offsetWidth / 2)) + 'px';
      } else {
        textFormatToolbar.style.display = 'none';
      }
    } else {
      // Small timeout to allow formatting clicks to register before hiding
      setTimeout(() => {
        if (window.getSelection().isCollapsed) {
          textFormatToolbar.style.display = 'none';
        }
      }, 100);
    }
  }

  if (textColorPicker) {
    textColorPicker.addEventListener('input', (e) => {
      document.execCommand('foreColor', false, e.target.value);
    });
  }

  async function saveChanges() {
    const editables = document.querySelectorAll('[data-editable]');
    const contentData = {};
    
    // Temporarily remove link edit buttons so their HTML isn't saved as text
    document.querySelectorAll('.admin-link-edit').forEach(el => el.remove());

    editables.forEach(el => {
      contentData[el.getAttribute('data-editable')] = el.innerHTML;
    });
    
    // Include custom styles in the save payload
    contentData.global_custom_css = customCssStyle.innerHTML;
    
    try {
      await fetch(`${API_BASE}/content`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(contentData)
      });
      alert('Changes saved to database successfully!');
      
      // Exit editing mode by manually calling the toggle
      if (isEditingMode) toggleVisualEditor();
      
    } catch (err) {
      alert('Failed to save to database.');
      toggleLinkEditors(true); // Put them back if save failed
    }
  }

  if (adminSaveChanges) {
    adminSaveChanges.addEventListener('click', saveChanges);
  }

  /* --- Admin Style Editor Logic --- */
  window.isMobileMode = false;
  
  const adminToggleMobile = document.getElementById('adminToggleMobile');
  const adminStyleEditor = document.getElementById('adminStyleEditor');
  const customCssStyle = document.getElementById('admin-custom-css');
  const styleBgColor = document.getElementById('styleBgColor');
  const styleSurfaceColor = document.getElementById('styleSurfaceColor');
  const stylePrimaryColor = document.getElementById('stylePrimaryColor');
  const styleAccentColor = document.getElementById('styleAccentColor');
  
  if (adminToggleMobile) {
    adminToggleMobile.addEventListener('change', (e) => {
      window.isMobileMode = e.target.checked;
      
      let previewStyle = document.getElementById('mobile-preview-style');
      if (!previewStyle) {
        previewStyle = document.createElement('style');
        previewStyle.id = 'mobile-preview-style';
        document.head.appendChild(previewStyle);
      }
      
      if (window.isMobileMode) {
        previewStyle.innerHTML = `
          body { background: #000; }
          .navbar, main, footer { 
            max-width: 375px; 
            margin: 0 auto; 
            background: var(--clr-bg);
            border-left: 1px dashed var(--clr-border);
            border-right: 1px dashed var(--clr-border);
            overflow-x: hidden;
            box-shadow: 0 0 50px rgba(255,255,255,0.05);
          }
        `;
      } else {
        previewStyle.innerHTML = '';
      }
    });
  }

  function initStylePickers() {
    const rootStyles = getComputedStyle(document.documentElement);
    // Helper to extract hex from rgb or return hex directly
    const getHex = (str) => {
      if(!str) return '#ffffff';
      str = str.trim();
      if(str.startsWith('#')) return str;
      const rgb = str.match(/\d+/g);
      if(!rgb) return '#ffffff';
      return `#${Number(rgb[0]).toString(16).padStart(2, '0')}${Number(rgb[1]).toString(16).padStart(2, '0')}${Number(rgb[2]).toString(16).padStart(2, '0')}`;
    };

    document.getElementById('styleBgColor').value = getHex(rootStyles.getPropertyValue('--clr-bg'));
    document.getElementById('styleSurfaceColor').value = getHex(rootStyles.getPropertyValue('--clr-surface'));
    document.getElementById('stylePrimaryColor').value = getHex(rootStyles.getPropertyValue('--clr-primary'));
    document.getElementById('styleAccentColor').value = getHex(rootStyles.getPropertyValue('--clr-accent'));
  }

  // Handle global color changes
  const styleInputs = ['styleBgColor', 'styleSurfaceColor', 'stylePrimaryColor', 'styleAccentColor'];
  const styleVars = ['--clr-bg', '--clr-surface', '--clr-primary', '--clr-accent'];
  
  styleInputs.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        let currentCss = customCssStyle.innerHTML;
        const rootRegex = /:root\s*{([^}]*)}/;
        let rootMatch = currentCss.match(rootRegex);
        let rootBlock = rootMatch ? rootMatch[1] : '';
        
        // Remove old var definition if exists
        const varRegex = new RegExp(`${styleVars[idx]}\\s*:[^;]+;`, 'g');
        rootBlock = rootBlock.replace(varRegex, '');
        // Add new
        rootBlock += ` ${styleVars[idx]}: ${e.target.value} !important;`;
        
        if (rootMatch) {
          customCssStyle.innerHTML = currentCss.replace(rootRegex, `:root {${rootBlock}}`);
        } else {
          customCssStyle.innerHTML = `:root {${rootBlock}}\n` + currentCss;
        }
      });
    }
  });

  // Universal Element Inspector Logic
  const adminHighlightBox = document.getElementById('adminHighlightBox');
  const universalStyleInspector = document.getElementById('universalStyleInspector');
  const usiTargetName = document.getElementById('usiTargetName');
  const usiBgColor = document.getElementById('usiBgColor');
  const usiTextColor = document.getElementById('usiTextColor');
  const usiBorderColor = document.getElementById('usiBorderColor');
  
  const usiFontWeight = document.getElementById('usiFontWeight');
  const usiFontSize = document.getElementById('usiFontSize');
  const usiLineHeight = document.getElementById('usiLineHeight');
  const usiPadding = document.getElementById('usiPadding');
  
  const usiCloseBtn = document.getElementById('usiCloseBtn');
  
  let currentStyleTarget = null;
  let inspectorFrozen = false; // When true, hovering doesn't move the highlight box

  document.addEventListener('mousemove', (e) => {
    if (!isEditingMode || inspectorFrozen || !adminHighlightBox) return;
    
    // Ignore hover over admin panels
    if (e.target.closest('#adminPanel') || e.target.closest('#universalStyleInspector')) {
      adminHighlightBox.style.display = 'none';
      return;
    }

    const target = e.target;
    const rect = target.getBoundingClientRect();
    
    adminHighlightBox.style.display = 'block';
    adminHighlightBox.style.top = (rect.top + window.scrollY) + 'px';
    adminHighlightBox.style.left = (rect.left + window.scrollX) + 'px';
    adminHighlightBox.style.width = rect.width + 'px';
    adminHighlightBox.style.height = rect.height + 'px';
  });

  document.addEventListener('click', (e) => {
    if (!isEditingMode || inspectorFrozen || !adminHighlightBox) return;
    
    // Don't trigger if clicking inside admin panels
    if (e.target.closest('#adminPanel') || e.target.closest('#universalStyleInspector')) return;

    // Block all other click actions
    e.preventDefault();
    e.stopPropagation();

    currentStyleTarget = e.target;
    inspectorFrozen = true;
    
    // Position the inspector panel near the click
    universalStyleInspector.style.display = 'flex';
    
    // Ensure the panel doesn't overflow the right side of the screen
    let leftPos = e.clientX + window.scrollX + 15;
    if (e.clientX + 250 > window.innerWidth) {
       leftPos = window.innerWidth + window.scrollX - 250;
    }
    
    universalStyleInspector.style.top = (e.clientY + window.scrollY + 15) + 'px';
    universalStyleInspector.style.left = leftPos + 'px';
    
    // Set Target Name
    let targetName = currentStyleTarget.tagName.toLowerCase();
    if(currentStyleTarget.id) targetName += '#' + currentStyleTarget.id;
    else if (currentStyleTarget.className && typeof currentStyleTarget.className === 'string') targetName += '.' + currentStyleTarget.className.split(' ')[0];
    usiTargetName.textContent = targetName;
    
    // Helper to get hex
    const getHex = (str) => {
      if(!str) return '#ffffff';
      const rgb = str.match(/\d+/g);
      if(!rgb || rgb.length < 3) return '#ffffff';
      return `#${Number(rgb[0]).toString(16).padStart(2, '0')}${Number(rgb[1]).toString(16).padStart(2, '0')}${Number(rgb[2]).toString(16).padStart(2, '0')}`;
    };
    
    const computedStyles = getComputedStyle(currentStyleTarget);
    usiBgColor.value = getHex(computedStyles.backgroundColor);
    usiTextColor.value = getHex(computedStyles.color);
    usiBorderColor.value = getHex(computedStyles.borderColor);
    
    // Load existing styles into new inputs if available
    usiFontWeight.value = computedStyles.fontWeight || '';
    const fontFamilyEl = document.getElementById('usiFontFamily');
    if (fontFamilyEl) {
      let ff = computedStyles.fontFamily;
      if (ff) {
        // Normalise quotes
        ff = ff.replace(/"/g, "'");
        // Try to match exact value from options, otherwise default
        const opts = Array.from(fontFamilyEl.options).map(o => o.value);
        fontFamilyEl.value = opts.find(o => o === ff || ff.includes(o.split(',')[0])) || '';
      }
    }
    
    // Dynamic Font Size Options
    const isHeading = /^(H1|H2|H3|H4|H5|H6)$/.test(currentStyleTarget.tagName);
    usiFontSize.innerHTML = `
      <option value="">Default</option>
      <option value="${isHeading ? '1.5rem' : '0.875rem'}">Small</option>
      <option value="${isHeading ? '2rem' : '1rem'}">Medium</option>
      <option value="${isHeading ? '3rem' : '1.5rem'}">Large</option>
    `;
  }, true); // Capture Phase

  // Close inspector
  if (usiCloseBtn) {
    usiCloseBtn.addEventListener('click', () => {
      universalStyleInspector.style.display = 'none';
      adminHighlightBox.style.display = 'none';
      inspectorFrozen = false;
      currentStyleTarget = null;
    });
  }

  // Handle CSS changes from inspector
  [ { el: usiBgColor, prop: 'background-color' }, 
    { el: usiTextColor, prop: 'color' }, 
    { el: usiBorderColor, prop: 'border-color' },
    { el: usiFontWeight, prop: 'font-weight' },
    { el: document.getElementById('usiFontFamily'), prop: 'font-family' },
    { el: usiFontSize, prop: 'font-size' }
  ].forEach(input => {
    if(input.el) {
      input.el.addEventListener('input', (e) => {
        if (!currentStyleTarget) return;
        
        let selector = '';
        if (currentStyleTarget.id) {
          selector = `#${currentStyleTarget.id}`;
        } else {
          if (!currentStyleTarget.hasAttribute('data-style-id')) {
            currentStyleTarget.setAttribute('data-style-id', 'styled_' + Date.now());
          }
          selector = `[data-style-id="${currentStyleTarget.getAttribute('data-style-id')}"]`;
        }

        let currentCss = customCssStyle.innerHTML;
        let escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Remove old single-property blocks for this selector and property
        let regNormal = new RegExp(escapedSelector + '\\s*\\{\\s*' + input.prop + '\\s*:[^}]+?\\}', 'g');
        currentCss = currentCss.replace(regNormal, '');
        
        let regMedia = new RegExp('@media\\s*\\([^)]+\\)\\s*\\{\\s*' + escapedSelector + '\\s*\\{\\s*' + input.prop + '\\s*:[^}]+?\\}\\s*\\}', 'g');
        currentCss = currentCss.replace(regMedia, '');

        // If a new value is provided, append it
        if (e.target.value) {
          if (window.isMobileMode) {
            currentCss += `@media (max-width: 768px) { ${selector} { ${input.prop}: ${e.target.value} !important; } }\n`;
          } else {
            currentCss += `${selector} { ${input.prop}: ${e.target.value} !important; }\n`;
          }
        }
        
        customCssStyle.innerHTML = currentCss;
      });
    }
  });

  // Styles are now saved along with text content in saveChanges

  function enableAdminMode() {
    if (adminPanel) adminPanel.classList.add('is-active');
    if (adminPhotoEdit) adminPhotoEdit.style.display = 'flex';
    if (adminGalleryAdd) adminGalleryAdd.style.display = 'flex';
    
    // Show Dynamic Add buttons
    const adminSubjectAdd = document.getElementById('adminSubjectAdd');
    if (adminSubjectAdd) adminSubjectAdd.style.display = 'block';
    const adminSkillAdd = document.getElementById('adminSkillAdd');
    if (adminSkillAdd) adminSkillAdd.style.display = 'block';
    const adminExpAdd = document.getElementById('adminExpAdd');
    if (adminExpAdd) adminExpAdd.style.display = 'block';
    const adminQualAdd = document.getElementById('adminQualAdd');
    if (adminQualAdd) adminQualAdd.style.display = 'block';
    const adminFaqAdd = document.getElementById('adminFaqAdd');
    if (adminFaqAdd) adminFaqAdd.style.display = 'block';
    const adminHeroTagAdd = document.getElementById('adminHeroTagAdd');
    if (adminHeroTagAdd) adminHeroTagAdd.style.display = 'inline-block';
    
    // Inject Edit buttons for SELECT elements instantly accessible via admin panel
    document.querySelectorAll('select[data-editable]').forEach(select => {
      let btn = select.nextElementSibling;
      if (!btn || !btn.classList.contains('admin-select-edit')) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'admin-select-edit btn btn--secondary btn--small';
        btn.textContent = 'Edit Options';
        btn.style.marginTop = '4px';
        btn.onclick = async (e) => {
          e.preventDefault();
          const currentOptions = Array.from(select.querySelectorAll('option'))
                                      .filter(opt => opt.value !== "")
                                      .map(opt => opt.value)
                                      .join(', ');
          const newOptions = prompt(`Enter comma-separated options for ${select.id}:`, currentOptions);
          if (newOptions !== null) {
            const placeholder = select.querySelector('option[value=""]');
            select.innerHTML = '';
            if (placeholder) select.appendChild(placeholder);
            
            newOptions.split(',').forEach(val => {
              const trimmed = val.trim();
              if (trimmed) {
                const opt = document.createElement('option');
                opt.value = trimmed;
                opt.textContent = trimmed;
                select.appendChild(opt);
              }
            });
            
            // Save directly
            try {
              const key = select.getAttribute('data-editable');
              await fetch(`${API_BASE}/content`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ [key]: select.innerHTML })
              });
            } catch (err) {
              alert('Failed to save options.');
            }
          }
        };
        select.parentNode.insertBefore(btn, select.nextSibling);
      }
      btn.style.display = 'inline-block';
    });
    
    // Show delete buttons on dynamic cards
    document.querySelectorAll('.admin-card-del').forEach(btn => btn.style.display = 'flex');

    loadDataFromBackend(); // Refresh to inject admin controls in gallery
  }

  function disableAdminMode() {
    if (adminPanel) adminPanel.classList.remove('is-active');
    if (adminPhotoEdit) adminPhotoEdit.style.display = 'none';
    if (adminGalleryAdd) adminGalleryAdd.style.display = 'none';
    
    document.querySelectorAll('.admin-select-edit').forEach(btn => btn.style.display = 'none');
    
    // Hide Dynamic Add buttons
    const adminSubjectAdd = document.getElementById('adminSubjectAdd');
    if (adminSubjectAdd) adminSubjectAdd.style.display = 'none';
    const adminSkillAdd = document.getElementById('adminSkillAdd');
    if (adminSkillAdd) adminSkillAdd.style.display = 'none';
    const adminExpAdd = document.getElementById('adminExpAdd');
    if (adminExpAdd) adminExpAdd.style.display = 'none';
    const adminQualAdd = document.getElementById('adminQualAdd');
    if (adminQualAdd) adminQualAdd.style.display = 'none';
    const adminFaqAdd = document.getElementById('adminFaqAdd');
    if (adminFaqAdd) adminFaqAdd.style.display = 'none';
    const adminHeroTagAdd = document.getElementById('adminHeroTagAdd');
    if (adminHeroTagAdd) adminHeroTagAdd.style.display = 'none';
    
    // Hide delete buttons on dynamic cards
    document.querySelectorAll('.admin-card-del').forEach(btn => btn.style.display = 'none');

    loadDataFromBackend(); // Refresh to remove admin controls
  }

  // Portrait Upload
  if (photoUpload) {
    photoUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target.result;
          heroPortrait.src = dataUrl;
          await fetch(`${API_BASE}/content`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ heroPortraitSrc: dataUrl })
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Gallery Add (Multiple)
  if (galleryUpload) {
    galleryUpload.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      let currentCount = document.querySelectorAll('.gallery-item:not(#adminGalleryAdd)').length;
      
      for (const file of files) {
        let caption = prompt(`Enter caption for image '${file.name}':`, "Parent feedback image");
        if (caption === null) continue; // Skip if cancelled

        currentCount++;
        const captionKey = 'galleryCap' + currentCount;
        
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target.result;
          const imgId = 'img_' + new Date().getTime() + Math.random().toString(36).substr(2, 5);
          
          // Post image to gallery
          await fetch(`${API_BASE}/gallery`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ id: imgId, src: dataUrl, order_idx: Date.now() })
          });
          
          // Post caption to content
          await fetch(`${API_BASE}/content`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ [captionKey]: caption })
          });
          
          loadDataFromBackend();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  /* =========================================
     DYNAMIC SECTIONS LOGIC
     ========================================= */
  
  function renderDynamicSections(sections) {
    // Clear previously rendered dynamic cards to avoid duplicates on reload
    document.querySelectorAll('.card--dynamic').forEach(el => el.remove());

    sections.forEach(sec => {
      // Migrate legacy emojis to Lucide icons dynamically
      if (sec.htmlContent) {
        sec.htmlContent = sec.htmlContent
          .replace('🎓', '<i data-lucide="graduation-cap"></i>')
          .replace('📘', '<i data-lucide="book"></i>')
          .replace('📚', '<i data-lucide="library"></i>')
          .replace('🔬', '<i data-lucide="microscope"></i>')
          .replace('🎖', '<i data-lucide="award"></i>')
          .replace('📖', '<i data-lucide="book-open"></i>');
      }
      
      if (sec.category === 'subject') {
        const subjectsGrid = document.getElementById('subjectsGrid');
        if (!subjectsGrid) return;
        
        const div = document.createElement('div');
        div.className = 'card card--subject card--dynamic animate-up';
        div.style.position = 'relative'; // For absolute delete btn
        div.style.opacity = '1'; 
        div.style.transform = 'translateY(0)';
        div.innerHTML = sec.htmlContent;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del';
        delBtn.innerHTML = '×';
        delBtn.style.display = isAdmin ? 'flex' : 'none';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '10px';
        delBtn.style.right = '10px';
        delBtn.onclick = () => window.deleteDynamicCard(sec.id);
        
        div.appendChild(delBtn);
        subjectsGrid.appendChild(div);
      } else if (sec.category === 'skill') {
        const skillsSection = document.getElementById('skills');
        if (!skillsSection) return;
        const skillsGrid = skillsSection.querySelector('.grid-2');
        if (!skillsGrid) return;

        const div = document.createElement('div');
        div.className = 'skill card--dynamic animate-up';
        div.style.position = 'relative'; 
        div.style.opacity = '1'; 
        div.style.transform = 'translateY(0)';
        div.innerHTML = sec.htmlContent;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del';
        delBtn.innerHTML = '×';
        delBtn.style.display = isAdmin ? 'flex' : 'none';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '0px';
        delBtn.style.right = '0px';
        delBtn.style.width = '24px';
        delBtn.style.height = '24px';
        delBtn.style.fontSize = '0.8rem';
        delBtn.onclick = () => window.deleteDynamicCard(sec.id);
        
        div.appendChild(delBtn);
        skillsGrid.appendChild(div);
      } else if (sec.category === 'experience') {
        const timeline = document.getElementById('experienceTimeline');
        if (!timeline) return;

        const div = document.createElement('div');
        div.className = 'timeline__item card--dynamic animate-up';
        div.style.position = 'relative'; 
        div.style.opacity = '1'; 
        div.style.transform = 'translateY(0)';
        div.innerHTML = sec.htmlContent;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del';
        delBtn.innerHTML = '× Delete Experience';
        delBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        delBtn.style.position = 'relative';
        delBtn.style.marginTop = '12px';
        delBtn.style.width = 'auto';
        delBtn.style.padding = '0 16px';
        delBtn.style.height = '32px';
        delBtn.style.borderRadius = '6px';
        delBtn.style.fontSize = '0.85rem';
        delBtn.onclick = () => window.deleteDynamicCard(sec.id);
        
        div.appendChild(delBtn);
        timeline.appendChild(div);
      } else if (sec.category === 'qualification') {
        const grid1 = document.getElementById('qualificationsGrid1');
        const grid2 = document.getElementById('qualificationsGrid2');
        if (!grid1 || !grid2) return;
        
        const div = document.createElement('div');
        div.className = 'card card--minimal card--dynamic animate-up';
        div.style.position = 'relative'; 
        div.style.opacity = '1'; 
        div.style.transform = 'translateY(0)';
        div.innerHTML = sec.htmlContent;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del';
        delBtn.innerHTML = '×';
        delBtn.style.display = isAdmin ? 'flex' : 'none';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '10px';
        delBtn.style.right = '10px';
        delBtn.onclick = () => window.deleteDynamicCard(sec.id);
        
        div.appendChild(delBtn);
        
        const currentCount = grid1.querySelectorAll('.card').length + grid2.querySelectorAll('.card').length;
        if (currentCount < 3) {
          grid1.appendChild(div);
        } else {
          grid2.appendChild(div);
        }
      } else if (sec.category === 'faq') {
        const accordion = document.getElementById('faqAccordion');
        if (!accordion) return;
        
        const div = document.createElement('div');
        div.className = 'faq-item card--dynamic animate-up';
        div.style.position = 'relative'; 
        div.style.opacity = '1'; 
        div.style.transform = 'translateY(0)';
        let html = sec.htmlContent;
        div.innerHTML = html;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del';
        delBtn.innerHTML = '×';
        delBtn.style.display = isAdmin ? 'flex' : 'none';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '10px';
        delBtn.style.right = '10px';
        delBtn.onclick = () => window.deleteDynamicCard(sec.id);
        
        div.appendChild(delBtn);
        accordion.appendChild(div);
      } else if (sec.category === 'hero_tag') {
        const badgesGrid = document.getElementById('heroBadgesGrid');
        if (!badgesGrid) return;

        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.display = 'inline-block';
        div.className = 'card--dynamic animate-fade-in';
        div.style.opacity = '1';
        div.innerHTML = sec.htmlContent;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del';
        delBtn.innerHTML = '×';
        delBtn.style.display = isAdmin ? 'flex' : 'none';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '-8px';
        delBtn.style.right = '-8px';
        delBtn.style.width = '16px';
        delBtn.style.height = '16px';
        delBtn.style.fontSize = '10px';
        delBtn.onclick = () => window.deleteDynamicCard(sec.id);
        
        div.appendChild(delBtn);
        
        const addBtn = document.getElementById('adminHeroTagAdd');
        if (addBtn) {
          badgesGrid.insertBefore(div, addBtn);
        } else {
          badgesGrid.appendChild(div);
        }
      } else if (sec.category === 'custom_page_section') {
        const container = document.getElementById('customSectionsContainer');
        if (!container) return;

        const div = document.createElement('section');
        div.className = 'section custom-page-section card--dynamic animate-up';
        div.id = sec.id;
        div.innerHTML = sec.htmlContent;
        div.style.position = 'relative';
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';

        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn admin-card-del admin-section-del';
        // If admin mode is active AND currently editing, show delete button
        delBtn.style.display = isAdmin && isEditingMode ? 'inline-flex' : 'none';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '20px';
        delBtn.style.right = '20px';
        delBtn.style.padding = '4px 12px';
        delBtn.style.fontSize = '0.9rem';
        delBtn.style.borderRadius = '4px';
        delBtn.style.zIndex = '100';
        delBtn.onclick = () => window.deleteDynamicCard(sec.id);
        
        div.appendChild(delBtn);
        container.appendChild(div);
      }
    });
    updateSubjectCarousel();
    updateExperienceVisibility();
    updateQualVisibility();
    updateFaqVisibility();
    if (window.initFaqAccordion) window.initFaqAccordion();
    if (window.lucide) window.lucide.createIcons();
  }

  window.addDynamicCard = async (category, dataObj = null) => {
    const id = 'dyn_' + new Date().getTime();
    let htmlContent = '';
    
    if (category === 'subject') {
      const icon = dataObj ? dataObj.icon : 'book-open';
      const title = dataObj ? dataObj.title : 'New Subject';
      const meta = dataObj ? dataObj.meta : 'Classes X - Y';
      const desc = dataObj ? dataObj.desc : 'Description of the subject.';
      const badge = dataObj ? dataObj.badge : 'Experience';

      htmlContent = `
        <div class="card__icon"><i data-lucide="${icon}"></i></div>
        <h3 class="card__title" data-editable="title_${id}">${title}</h3>
        <p class="card__meta" data-editable="meta_${id}">${meta}</p>
        <p class="card__desc" data-editable="desc_${id}">${desc}</p>
        <span class="badge badge--dark" data-editable="badge_${id}">${badge}</span>
      `;
    } else if (category === 'skill') {
      const title = dataObj ? dataObj.title : 'New Skill';
      const level = dataObj ? dataObj.level : 'Expert';
      const percent = dataObj ? dataObj.percent : '90';

      htmlContent = `
        <div class="skill__header" style="padding-right: 30px;">
          <span class="skill__name" data-editable="title_${id}">${title}</span>
          <span class="skill__level" data-editable="level_${id}">${level}</span>
        </div>
        <div class="skill__bar">
          <div class="skill__fill" style="width: ${percent}%;"></div>
        </div>
      `;
    } else if (category === 'experience') {
      const title = dataObj ? dataObj.title : 'Job Title';
      const meta = dataObj ? dataObj.meta : 'Location & Dates';
      const desc = dataObj ? dataObj.desc : 'Description of your role.';

      htmlContent = `
        <div class="timeline__marker"></div>
        <h4 class="timeline__title" data-editable="title_${id}" style="padding-right: 30px;">${title}</h4>
        <p class="timeline__meta" data-editable="meta_${id}">${meta}</p>
        <p class="timeline__desc" data-editable="desc_${id}">${desc}</p>
      `;
    } else if (category === 'qualification') {
      const icon = dataObj ? dataObj.icon : 'graduation-cap';
      const title = dataObj ? dataObj.title : 'Degree';
      const desc = dataObj ? dataObj.desc : 'Description of degree.';

      htmlContent = `
        <div class="qual-icon"><i data-lucide="${icon}"></i></div>
        <h4 class="card__title" data-editable="title_${id}">${title}</h4>
        <p class="card__desc" data-editable="desc_${id}">${desc}</p>
      `;
    } else if (category === 'faq') {
      const q = dataObj ? dataObj.q : 'Question';
      const a = dataObj ? dataObj.a : 'Answer';

      htmlContent = `
        <button class="faq-question" style="padding-right: 40px;"><span data-editable="q_${id}">${q}</span> <span class="faq-icon">+</span></button>
        <div class="faq-answer"><p data-editable="a_${id}">${a}</p></div>
      `;
    } else if (category === 'hero_tag') {
      const text = prompt("Enter tag text (e.g. 'Mathematics' or '7+ Years Exp.'):", "New Tag");
      if (!text) return; // User cancelled
      const isPrimary = confirm("Make this a highlighted tag? (OK for Primary/Blue, Cancel for Dark)");
      const badgeClass = isPrimary ? 'badge badge--primary' : 'badge badge--dark';
      htmlContent = `<span class="${badgeClass}" data-editable="tag_${id}">${text}</span>`;
    } else if (category === 'custom_page_section') {
      htmlContent = dataObj ? dataObj.htmlContent : '';
    }

    try {
      await fetch(`${API_BASE}/dynamic`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ id, category, htmlContent, order_idx: Date.now() })
      });
      // After adding, fetch latest data and if we are editing, re-trigger editable state
      await loadDataFromBackend();
      if (isEditingMode) {
        document.querySelectorAll('[data-editable]').forEach(el => el.setAttribute('contenteditable', 'true'));
        window.applyAdminUI();
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteDynamicCard = async (id) => {
    if (confirm('Delete this card entirely?')) {
      try {
        await fetch(`${API_BASE}/dynamic/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
        });
        loadDataFromBackend();
      } catch (err) {
        console.error(err);
      }
    }
  };

  window.uploadSectionImage = async (e, imageId) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      try {
        await fetch(`${API_BASE}/content`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ [imageId]: dataUrl })
        });
        const imgEl = document.querySelector(`[data-editable-image="${imageId}"]`);
        if (imgEl) {
          imgEl.src = dataUrl;
          imgEl.style.display = 'block';
          const placeholder = imgEl.parentElement.querySelector('.placeholder-box');
          if (placeholder) placeholder.style.display = 'none';
        }
      } catch (err) { console.error('Failed to upload image', err); }
    };
    reader.readAsDataURL(file);
  };

  window.saveCustomLayout = async (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Clone it so we can strip out admin UI
    const clone = section.cloneNode(true);
    clone.querySelectorAll('.admin-section-del, .admin-card-del, .admin-section-builder, .admin-img-upload-btn, .admin-mobile-guide').forEach(el => el.remove());

    const htmlContent = clone.innerHTML;

    try {
      await fetch(`${API_BASE}/dynamic`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ id: sectionId, category: 'custom_page_section', htmlContent, order_idx: Date.now() })
      });
      alert('Layout saved permanently!');
    } catch (err) {
      console.error(err);
      alert('Failed to save layout.');
    }
  };

  /* --- Subject Carousel Logic --- */
  const subjectPrev = document.getElementById('subjectPrev');
  const subjectNext = document.getElementById('subjectNext');
  const subjectsGrid = document.getElementById('subjectsGrid');
  const subjectControls = document.getElementById('subjectCarouselControls');

  function updateSubjectCarousel() {
    if (!subjectsGrid || !subjectControls) return;
    const cards = subjectsGrid.querySelectorAll('.card').length;
    if (cards > 3) {
      subjectControls.style.display = 'flex';
      subjectsGrid.style.justifyContent = 'flex-start';
    } else {
      subjectControls.style.display = 'none';
      subjectsGrid.style.justifyContent = 'center';
    }
  }
  
  // Initial check for static cards
  updateSubjectCarousel();

  if (subjectPrev && subjectNext && subjectsGrid) {
    const getSubjectScrollAmount = () => {
      const firstCard = subjectsGrid.querySelector('.card');
      if (!firstCard) return 300;
      const gap = parseInt(window.getComputedStyle(subjectsGrid).gap) || 24;
      return firstCard.offsetWidth + gap;
    };
    subjectNext.addEventListener('click', () => { subjectsGrid.scrollBy({ left: getSubjectScrollAmount(), behavior: 'smooth' }); });
    subjectPrev.addEventListener('click', () => { subjectsGrid.scrollBy({ left: -getSubjectScrollAmount(), behavior: 'smooth' }); });
  }

  /* --- Experience View More Logic --- */
  const expViewMoreBtn = document.getElementById('expViewMoreBtn');
  let isExpExpanded = false;

  function updateExperienceVisibility() {
    const timeline = document.getElementById('experienceTimeline');
    if (!timeline || !expViewMoreBtn) return;
    const items = timeline.querySelectorAll('.timeline__item');
    
    if (items.length > 3) {
      expViewMoreBtn.style.display = 'inline-flex';
      items.forEach((item, index) => {
        if (index >= 3) {
          item.style.display = isExpExpanded ? 'block' : 'none';
        }
      });
      expViewMoreBtn.textContent = isExpExpanded ? 'View Less' : 'View More';
    } else {
      expViewMoreBtn.style.display = 'none';
      items.forEach(item => item.style.display = 'block');
    }
  }

  if (expViewMoreBtn) {
    expViewMoreBtn.addEventListener('click', () => {
      isExpExpanded = !isExpExpanded;
      updateExperienceVisibility();
    });
  }

  /* --- Qual View More Logic --- */
  const qualViewMoreBtn = document.getElementById('qualViewMoreBtn');
  let isQualExpanded = false;

  function updateQualVisibility() {
    const grid1 = document.getElementById('qualificationsGrid1');
    const grid2 = document.getElementById('qualificationsGrid2');
    if (!grid1 || !grid2 || !qualViewMoreBtn) return;
    const items = [...grid1.querySelectorAll('.card'), ...grid2.querySelectorAll('.card')];
    
    if (items.length > 5) {
      qualViewMoreBtn.style.display = 'inline-block';
      items.forEach((item, index) => {
        if (index >= 5) {
          item.style.display = isQualExpanded ? 'block' : 'none';
        }
      });
      qualViewMoreBtn.textContent = isQualExpanded ? 'View Less' : 'View More';
    } else {
      qualViewMoreBtn.style.display = 'none';
      items.forEach(item => item.style.display = 'block');
    }
  }

  if (qualViewMoreBtn) {
    qualViewMoreBtn.addEventListener('click', () => {
      isQualExpanded = !isQualExpanded;
      updateQualVisibility();
    });
  }

  /* --- FAQ View More Logic --- */
  const faqViewMoreBtn = document.getElementById('faqViewMoreBtn');
  let isFaqExpanded = false;

  function updateFaqVisibility() {
    const accordion = document.getElementById('faqAccordion');
    if (!accordion || !faqViewMoreBtn) return;
    const items = accordion.querySelectorAll('.faq-item');
    
    if (items.length > 3) {
      faqViewMoreBtn.style.display = 'inline-block';
      items.forEach((item, index) => {
        if (index >= 3) {
          item.style.display = isFaqExpanded ? 'block' : 'none';
        }
      });
      faqViewMoreBtn.textContent = isFaqExpanded ? 'View Less' : 'View More';
    } else {
      faqViewMoreBtn.style.display = 'none';
      items.forEach(item => item.style.display = 'block');
    }
  }

  if (faqViewMoreBtn) {
    faqViewMoreBtn.addEventListener('click', () => {
      isFaqExpanded = !isFaqExpanded;
      updateFaqVisibility();
    });
  }

  /* --- Dynamic Modals Logic (Refactored) --- */
  function setupDynamicModal(openBtnId, modalId, cancelBtnId, formId, category, getDataFn) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const cancelBtn = document.getElementById(cancelBtnId);
    const form = document.getElementById(formId);

    if (openBtn && modal) openBtn.addEventListener('click', () => modal.showModal());
    if (cancelBtn && modal) cancelBtn.addEventListener('click', () => modal.close());
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.addDynamicCard(category, getDataFn());
        modal.close();
        form.reset();
      });
    }
  }

  setupDynamicModal('openAddSubjectBtn', 'addSubjectModal', 'addSubjectCancel', 'addSubjectForm', 'subject', () => ({
    icon: document.getElementById('subIcon').value,
    title: document.getElementById('subTitle').value,
    meta: document.getElementById('subMeta').value,
    desc: document.getElementById('subDesc').value,
    badge: document.getElementById('subBadge').value
  }));

  setupDynamicModal('openAddSkillBtn', 'addSkillModal', 'addSkillCancel', 'addSkillForm', 'skill', () => ({
    title: document.getElementById('skillTitle').value,
    level: document.getElementById('skillLevel').value,
    percent: document.getElementById('skillPercent').value
  }));

  setupDynamicModal('openAddExpBtn', 'addExpModal', 'addExpCancel', 'addExpForm', 'experience', () => ({
    title: document.getElementById('expTitle').value,
    meta: document.getElementById('expMeta').value,
    desc: document.getElementById('expDesc').value
  }));

  setupDynamicModal('openAddQualBtn', 'addQualModal', 'addQualCancel', 'addQualForm', 'qualification', () => ({
    icon: document.getElementById('qualIcon').value,
    title: document.getElementById('qualTitle').value,
    desc: document.getElementById('qualDesc').value
  }));

  setupDynamicModal('openAddFaqBtn', 'addFaqModal', 'addFaqCancel', 'addFaqForm', 'faq', () => ({
    q: document.getElementById('faqQ').value,
    a: document.getElementById('faqA').value
  }));

  /* --- Custom Page Sections Logic --- */
  const openAddSectionBtn = document.getElementById('openAddSectionBtn');
  const addSectionModal = document.getElementById('addSectionModal');
  const closeSectionModalBtn = document.getElementById('closeSectionModalBtn');

  if (openAddSectionBtn && addSectionModal) {
    openAddSectionBtn.addEventListener('click', () => addSectionModal.showModal());
  }
  if (closeSectionModalBtn && addSectionModal) {
    closeSectionModalBtn.addEventListener('click', () => addSectionModal.close());
  }

  document.querySelectorAll('#addSectionModal .template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.template;
      const id = 'sec_' + Date.now();
      let html = '';

      if (type === 'split') {
        html = `
          <div class="container" style="display:flex; flex-wrap:wrap; gap:32px; align-items:center;">
            <div style="flex: 1 1 300px;">
              <h2 class="section__title" data-editable="title_${id}">New Feature</h2>
              <p class="section__subtitle" data-editable="sub_${id}">Highlight your content</p>
              <p style="color:var(--clr-muted); margin-bottom:16px;" data-editable="desc_${id}">This is a great place to write a descriptive paragraph about your subject. You can edit this text using the text editor, and change the image on the right using the style editor background property.</p>
              <button class="btn btn--primary" data-editable="btn_${id}">Learn More</button>
            </div>
            <div class="custom-image-wrapper" style="flex: 1 1 300px; height: 300px; background:var(--clr-surface); border-radius:12px; display:flex; align-items:center; justify-content:center; text-align:center; position:relative; overflow:hidden;">
              <img src="" style="width:100%; height:100%; object-fit:cover; display:none;" data-editable-image="img_${id}">
              <div class="placeholder-box">
                <span style="color:var(--clr-muted);">Image Placeholder</span>
              </div>
            </div>
          </div>
        `;
      } else if (type === 'grid') {
        html = `
          <div class="container">
            <div class="section__header text-center" style="text-align:center;">
              <h3 class="section__subtitle" data-editable="sub_${id}">What we offer</h3>
              <h2 class="section__title" data-editable="title_${id}">Services</h2>
            </div>
            <div class="grid-3 gap-24">
              <div class="card card--minimal" style="text-align:center;">
                <h3 data-editable="col1_${id}">Service 1</h3>
                <p data-editable="c1desc_${id}">Description of service one.</p>
              </div>
              <div class="card card--minimal" style="text-align:center;">
                <h3 data-editable="col2_${id}">Service 2</h3>
                <p data-editable="c2desc_${id}">Description of service two.</p>
              </div>
              <div class="card card--minimal" style="text-align:center;">
                <h3 data-editable="col3_${id}">Service 3</h3>
                <p data-editable="c3desc_${id}">Description of service three.</p>
              </div>
            </div>
          </div>
        `;
      } else if (type === 'cta') {
        html = `
          <div class="container" style="text-align:center; padding: 64px 24px; background:var(--clr-surface); border-radius:16px;">
            <h2 class="section__title" data-editable="title_${id}">Ready to start?</h2>
            <p style="color:var(--clr-muted); max-width:600px; margin: 16px auto 32px;" data-editable="desc_${id}">Join us today and experience the difference.</p>
            <button class="btn btn--primary" data-editable="btn_${id}">Get Started</button>
          </div>
        `;
      } else if (type === 'blank') {
        html = `
          <div class="container" style="min-height: 200px; display:flex; flex-direction:column; gap:16px;">
          </div>
        `;
      }

      window.addDynamicCard('custom_page_section', { htmlContent: html });
      addSectionModal.close();
    });
  });

  /* --- Image Lightbox Logic --- */
  const imageLightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeLightbox = document.getElementById('closeLightbox');

  if (imageLightbox && lightboxImg) {
    // Open lightbox when a gallery image is clicked
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('gallery-img')) {
        const src = e.target.getAttribute('src');
        lightboxImg.setAttribute('src', src);
        
        // Find caption if it exists
        const parent = e.target.closest('.gallery-item');
        if (parent) {
          const captionEl = parent.querySelector('.gallery-caption');
          if (captionEl) {
            lightboxCaption.textContent = captionEl.textContent;
          } else {
            lightboxCaption.textContent = '';
          }
        }
        
        imageLightbox.style.display = 'flex';
        // Add a small fade in
        imageLightbox.style.opacity = '0';
        setTimeout(() => { imageLightbox.style.transition = 'opacity 0.3s'; imageLightbox.style.opacity = '1'; }, 10);
      }
    });

    // Close lightbox on click outside or close button
    imageLightbox.addEventListener('click', (e) => {
      if (e.target !== lightboxImg) {
        imageLightbox.style.opacity = '0';
        setTimeout(() => { imageLightbox.style.display = 'none'; }, 300);
      }
    });
  }

  /* --- Mobile Subjects View More Logic --- */
  const subjectsGridMobile = document.getElementById('subjectsGrid');
  const subjectViewMoreBtn = document.getElementById('subjectViewMoreBtn');
  
  function initMobileSubjects() {
    if (window.innerWidth <= 768 && subjectsGridMobile && subjectViewMoreBtn) {
      const cards = Array.from(subjectsGridMobile.querySelectorAll('.card'));
      // Only show top 2 cards, hide the rest
      if (cards.length > 2) {
        cards.forEach((card, index) => {
          if (index >= 2) {
            card.classList.add('hidden-on-mobile');
          }
        });
        subjectViewMoreBtn.style.display = 'inline-block';
        
        subjectViewMoreBtn.onclick = () => {
          cards.forEach(card => card.classList.remove('hidden-on-mobile'));
          subjectViewMoreBtn.style.display = 'none';
        };
      } else {
        subjectViewMoreBtn.style.display = 'none';
      }
    }
  }
  
  // Need to run this after dynamic sections hydrate, so we setTimeout or just call it 
  // Let's call it after a short delay to ensure hydration is done, or run immediately for static ones.
  setTimeout(initMobileSubjects, 500);
  
});
