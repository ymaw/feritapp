import { parseGarmentDictation } from './dictation-parser.js';

const MEASUREMENT_CATEGORIES = new Set(['pantalones', 'capris', 'polleras', 'vestidos']);

function normalizeCategory(value) {
  return String(value || '').trim().toLocaleLowerCase('es');
}

function readValue(id) {
  const element = document.getElementById(id);
  return element ? String(element.value || '').trim() : '';
}

function formatPrice(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  return '$' + Number(digits).toLocaleString('es-AR');
}

function buildGarmentPost(data) {
  const lines = [];
  const title = data.garmentName || data.category || 'Prenda';
  lines.push('✨ ' + title);
  if (data.brand) lines.push('Marca: ' + data.brand);
  if (data.size) lines.push('Talle: ' + data.size);
  if (data.observations) lines.push(data.observations);
  const measurements = (data.measurements || []).filter(function(item) { return item.value; });
  if (measurements.length) {
    lines.push('');
    lines.push('Medidas:');
    measurements.forEach(function(item) { lines.push('• ' + item.label + ': ' + item.value + ' cm'); });
  }
  if (data.price) {
    lines.push('');
    lines.push('💰 Precio: ' + data.price);
  }
  return lines.join('\n');
}

export function initGarmentPublisher({ showToast }) {
  const category = document.getElementById('publisherCategory');
  const photoInput = document.getElementById('publisherPhoto');
  const photoPreview = document.getElementById('publisherPhotoPreview');
  const postText = document.getElementById('publisherPostText');
  const feedback = document.getElementById('publisherFeedback');
  if (!category || !photoInput || !photoPreview || !postText) return;

  let selectedPhoto = null;
  let previewUrl = null;
  const queuedGarments = [];
  const queuedList = document.getElementById('publisherQueuedGarments');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const dictationStart = document.getElementById('publisherDictationStart');
  const dictationStop = document.getElementById('publisherDictationStop');
  const transcriptField = document.getElementById('publisherTranscript');
  const dictationStatus = document.getElementById('publisherDictationStatus');
  const useTranscript = document.getElementById('publisherUseTranscript');
  let recognition = null;
  let finalTranscriptParts = [];
  let isDictating = false;
  let dictationErrorMessage = '';

  function updateDictationControls() {
    dictationStart.disabled = !SpeechRecognition || isDictating;
    dictationStop.disabled = !isDictating;
    useTranscript.disabled = !transcriptField.value.trim() || isDictating;
    dictationStart.textContent = isDictating ? 'Escuchando…' : 'Comenzar a grabar';
  }

  if (!SpeechRecognition) {
    dictationStart.disabled = true;
    dictationStop.disabled = true;
    dictationStatus.textContent = 'Este navegador no ofrece transcripción por voz. Podés escribir o pegar la descripción manualmente.';
  }

  dictationStart.addEventListener('click', function() {
    if (!SpeechRecognition || isDictating) return;
    finalTranscriptParts = [];
    dictationErrorMessage = '';
    transcriptField.value = '';
    recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = function() {
      isDictating = true;
      dictationStatus.textContent = 'Escuchando. Hablá con naturalidad; podés detener cuando termines.';
      updateDictationControls();
    };
    recognition.onresult = function(event) {
      let interimTranscript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const phrase = result[0] && result[0].transcript ? result[0].transcript.trim() : '';
        if (result.isFinal && phrase) finalTranscriptParts[index] = phrase;
        else if (phrase) interimTranscript += (interimTranscript ? ' ' : '') + phrase;
      }
      const finalText = finalTranscriptParts.filter(Boolean).join(' ').trim();
      transcriptField.value = [finalText, interimTranscript].filter(Boolean).join(' ').slice(0, 1200);
      updateDictationControls();
    };
    recognition.onerror = function(event) {
      const messages = {
        'not-allowed': 'No se concedió permiso para usar el micrófono.',
        'service-not-allowed': 'El navegador o dispositivo bloqueó el reconocimiento de voz.',
        'no-speech': 'No se detectó voz. Podés volver a intentarlo.',
        'audio-capture': 'No se encontró un micrófono disponible.'
      };
      dictationErrorMessage = messages[event.error] || 'Ocurrió un problema con el reconocimiento de voz. Revisá el texto y volvé a intentar si hace falta.';
      dictationStatus.textContent = dictationErrorMessage;
    };
    recognition.onend = function() {
      isDictating = false;
      recognition = null;
      dictationStatus.textContent = dictationErrorMessage || (transcriptField.value.trim()
        ? 'Transcripción lista. Revisala y editá lo que necesites antes de incorporarla.'
        : 'No se obtuvo una transcripción. Podés volver a intentarlo o escribir la descripción.');
      updateDictationControls();
    };
    try {
      recognition.start();
    } catch (error) {
      recognition = null;
      isDictating = false;
      dictationStatus.textContent = 'No se pudo iniciar el micrófono. Verificá los permisos del navegador.';
      updateDictationControls();
    }
  });

  dictationStop.addEventListener('click', function() {
    if (recognition && isDictating) recognition.stop();
  });

  transcriptField.addEventListener('input', updateDictationControls);

  useTranscript.textContent = 'Interpretar y completar campos';
  useTranscript.addEventListener('click', function() {
    const transcript = transcriptField.value.trim();
    if (!transcript || isDictating) return;
    const parsed = parseGarmentDictation(transcript);
    const fields = [
      ['category', 'publisherCategory'], ['garmentName', 'publisherGarmentName'],
      ['brand', 'publisherBrand'], ['size', 'publisherSize'], ['price', 'publisherPrice'],
      ['waist', 'publisherWaist'], ['rise', 'publisherRise'], ['hip', 'publisherHip'], ['length', 'publisherLength']
    ];
    let applied = [];
    fields.forEach(function(pair) {
      const value = parsed[pair[0]];
      const element = document.getElementById(pair[1]);
      const categoryIsUnselected = pair[0] === 'category' && element && element.selectedIndex === 0;
      const fieldIsEmpty = element && !element.value.trim();
      if (value && element && (categoryIsUnselected || fieldIsEmpty)) {
        element.value = value;
        applied.push(pair[0]);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    if (parsed.observations) {
      const observations = document.getElementById('publisherObservations');
      if (!observations.value.trim()) observations.value = parsed.observations.slice(0, 1200);
      else observations.value = [observations.value.trim(), parsed.observations].join('\n').slice(0, 1200);
      observations.dispatchEvent(new Event('input', { bubbles: true }));
    }
    updateCategoryTemplate();
    refreshLivePreview();
    // Keep the reviewed source text available after parsing; only mapped fields are populated.
    transcriptField.value = transcript;
    updateDictationControls();
    dictationStatus.textContent = applied.length
      ? 'Datos identificados y completados en campos vacíos. Revisalos antes de publicar; la transcripción original sigue disponible.'
      : 'No se identificaron datos estructurados con suficiente certeza. Podés usar la transcripción como observaciones o completar los campos manualmente.';
  });

  updateDictationControls();

  function renderQueuedGarments() {
    if (!queuedList) return;
    queuedList.replaceChildren();
    queuedGarments.forEach(function(item, index) {
      const row = document.createElement('div');
      row.className = 'publisher-queued-item';
      if (item.previewUrl) {
        const thumbnail = document.createElement('img');
        thumbnail.className = 'publisher-queued-photo';
        thumbnail.src = item.previewUrl;
        thumbnail.alt = 'Foto de ' + (item.data.garmentName || item.data.category || 'prenda');
        row.appendChild(thumbnail);
      }
      const description = document.createElement('span');
      description.className = 'publisher-queued-description';
      description.textContent = (index + 1) + '. ' + (item.data.garmentName || item.data.category || 'Prenda') +
        (item.data.brand ? ' · ' + item.data.brand : '') + (item.photo ? ' · Foto adjunta' : ' · Sin foto');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary-btn';
      remove.textContent = 'Quitar';
      remove.setAttribute('aria-label', 'Quitar ' + (item.data.garmentName || 'prenda ' + (index + 1)));
      remove.addEventListener('click', function() {
        const removed = queuedGarments.splice(index, 1)[0];
        if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        renderQueuedGarments();
        renderPreviewPhotos();
      });
      row.append(description, remove);
      queuedList.appendChild(row);
    });
    queuedList.hidden = queuedGarments.length === 0;
  }

  function hasCurrentGarment(data) {
    return Boolean(data.garmentName || data.category || data.brand || data.size || data.observations ||
      data.price || data.measurements.some(function(item) { return item.value; }) || selectedPhoto);
  }

  function resetCurrentGarment() {
    ['publisherCategory','publisherGarmentName','publisherBrand','publisherSize','publisherPrice',
      'publisherObservations','publisherWaist','publisherRise','publisherHip','publisherLength',
      'publisherTranscript'].forEach(function(id) {
      const element = document.getElementById(id);
      if (element) element.value = id === 'publisherCategory' ? 'Otros' : '';
    });
    clearCurrentPhotoPreview();
    photoInput.value = '';
    updateCategoryTemplate();
    updateDictationControls();
  }

  document.getElementById('publisherAddGarment').addEventListener('click', function() {
    if (isDictating) {
      if (recognition) recognition.stop();
      feedback.textContent = 'El dictado se está deteniendo. Revisá la transcripción y volvé a agregar la prenda.';
      return;
    }
    const data = collectData();
    if (!hasCurrentGarment(data)) {
      feedback.textContent = 'Completá al menos un dato o seleccioná una fotografía antes de agregar la prenda.';
      return;
    }
    queuedGarments.push({ data: data, photo: selectedPhoto, previewUrl: previewUrl });
    previewUrl = null;
    renderQueuedGarments();
    resetCurrentGarment();
    renderPreviewPhotos();
    refreshLivePreview();
    feedback.textContent = 'Prenda agregada a la publicación. Podés cargar otra o generar el post con todas.';
  });

  function updateCategoryTemplate() {
    const isMeasurement = MEASUREMENT_CATEGORIES.has(normalizeCategory(category.value));
    document.getElementById('publisherMeasurements').hidden = !isMeasurement;
  }

  function collectData() {
    const isMeasurement = MEASUREMENT_CATEGORIES.has(normalizeCategory(category.value));
    return {
      category: category.value === 'Otros' ? '' : category.value,
      garmentName: readValue('publisherGarmentName'),
      brand: readValue('publisherBrand'),
      size: readValue('publisherSize'),
      observations: readValue('publisherObservations'),
      price: formatPrice(readValue('publisherPrice')),
      measurements: isMeasurement ? [
        { label: 'Cintura', value: readValue('publisherWaist') },
        { label: 'Tiro delantero', value: readValue('publisherRise') },
        { label: 'Cadera', value: readValue('publisherHip') },
        { label: 'Largo', value: readValue('publisherLength') }
      ] : []
    };
  }

  category.addEventListener('change', updateCategoryTemplate);
  updateCategoryTemplate();
  const publisherLayout = document.querySelector('#viewPublisher .publisher-layout');
  const previewCard = document.querySelector('#viewPublisher .publisher-preview-card');
  const previewModal = document.getElementById('publisherPreviewModal');
  const previewModalContent = document.getElementById('publisherPreviewModalContent');
  const openPreview = document.getElementById('publisherOpenPreview');
  const closePreview = document.getElementById('publisherClosePreview');
  function renderPreviewPhotos() {
    const photos = queuedGarments
      .filter(function(item) { return item.previewUrl; })
      .map(function(item) {
        return { url: item.previewUrl, alt: 'Fotografía de ' + (item.data.garmentName || item.data.category || 'prenda') };
      });
    if (selectedPhoto && previewUrl) {
      photos.push({ url: previewUrl, alt: 'Vista previa de la fotografía de la prenda actual' });
    }
    photoPreview.replaceChildren();
    photoPreview.classList.toggle('is-gallery', photos.length > 1);
    if (!photos.length) {
      const placeholder = document.createElement('span');
      placeholder.textContent = 'La fotografía seleccionada aparecerá acá';
      photoPreview.appendChild(placeholder);
      return;
    }
    photos.forEach(function(item) {
      const image = document.createElement('img');
      image.src = item.url;
      image.alt = item.alt;
      photoPreview.appendChild(image);
    });
  }

  function refreshLivePreview() {
    const items = queuedGarments.slice();
    const current = collectData();
    if (hasCurrentGarment(current)) items.push({ data: current, photo: selectedPhoto });
    if (items.length && !postText.dataset.userEdited) {
      postText.value = items.map(function(item,index) {
        return (items.length > 1 ? '🛍️ PRENDA ' + (index + 1) + '\n' : '') + buildGarmentPost(item.data);
      }).join(items.length > 1 ? '\n\n────────────\n\n' : '');
    } else if (!items.length && !postText.dataset.userEdited) postText.value = '';
  }
  ['publisherCategory','publisherGarmentName','publisherBrand','publisherSize','publisherPrice','publisherObservations','publisherWaist','publisherRise','publisherHip','publisherLength'].forEach(function(id) {
    const field = document.getElementById(id);
    if (field) { field.addEventListener('input',refreshLivePreview); field.addEventListener('change',refreshLivePreview); }
  });
  postText.addEventListener('input',function(){postText.dataset.userEdited='true';});
  function openMobilePreview() {
    if (window.matchMedia('(min-width: 900px)').matches) return;
    previewModal.hidden=false;
    previewModalContent.appendChild(previewCard);
    closePreview.focus();
  }
  function closeMobilePreview() {
    previewModal.hidden=true;
    publisherLayout.appendChild(previewCard);
    openPreview.focus();
  }
  openPreview.addEventListener('click',openMobilePreview);
  closePreview.addEventListener('click',closeMobilePreview);
  previewModal.querySelector('[data-publisher-preview-close]').addEventListener('click',closeMobilePreview);
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!previewModal.hidden)closeMobilePreview();});
  renderPreviewPhotos();
  refreshLivePreview();

  document.getElementById('publisherGenerate').addEventListener('click', function() {
    const currentData = collectData();
    const items = queuedGarments.slice();
    if (hasCurrentGarment(currentData)) {
      items.push({ data: currentData, photo: selectedPhoto });
    }
    if (items.length === 0) {
      feedback.textContent = 'Agregá al menos una prenda antes de generar la publicación.';
      return;
    }
    postText.value = items.map(function(item, index) {
      const heading = items.length > 1 ? '🛍️ PRENDA ' + (index + 1) + '\n' : '';
      return heading + buildGarmentPost(item.data);
    }).join(items.length > 1 ? '\n\n────────────\n\n' : '');
    delete postText.dataset.userEdited;
    feedback.textContent = items.length > 1
      ? 'Plantilla generada con ' + items.length + ' prendas. Revisá el texto y las fotografías antes de compartir.'
      : 'Plantilla generada. Revisá el texto antes de compartir.';
  });

  function clearCurrentPhotoPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    selectedPhoto = null;
    renderPreviewPhotos();
  }

  photoInput.addEventListener('change', function() {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      photoInput.value = '';
      clearCurrentPhotoPreview();
      feedback.textContent = 'Formato no compatible. Elegí una imagen JPG, PNG o WebP.';
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      photoInput.value = '';
      clearCurrentPhotoPreview();
      feedback.textContent = 'La imagen supera el límite de 12 MB.';
      return;
    }
    selectedPhoto = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    renderPreviewPhotos();
    refreshLivePreview();
    feedback.textContent = 'Fotografía lista para adjuntar.';
  });

  document.getElementById('publisherCopy').addEventListener('click', async function() {
    const text = postText.value.trim();
    if (!text) {
      feedback.textContent = 'Primero generá o escribí el texto de la publicación.';
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      feedback.textContent = 'Texto copiado. Ya podés pegarlo en Facebook.';
    } catch (error) {
      postText.focus();
      postText.select();
      const copied = document.execCommand && document.execCommand('copy');
      feedback.textContent = copied ? 'Texto copiado. Ya podés pegarlo en Facebook.' : 'No se pudo copiar automáticamente. Seleccioná el texto y copialo.';
    }
  });

  document.getElementById('publisherShare').addEventListener('click', async function() {
    const text = postText.value.trim();
    if (!text) {
      feedback.textContent = 'Primero generá o escribí el texto de la publicación.';
      return;
    }
    const shareData = { title: 'Publicación de prendas', text: text };
    const photos = queuedGarments.map(function(item) { return item.photo; }).filter(Boolean);
    if (selectedPhoto) photos.push(selectedPhoto);
    if (photos.length) shareData.files = photos;
    try {
      if (photos.length && navigator.canShare && navigator.canShare({ files: shareData.files })) {
        await navigator.share(shareData);
        feedback.textContent = 'Se abrió el menú para compartir texto y fotografía.';
        return;
      }
      if (!photos.length && navigator.share) {
        await navigator.share(shareData);
        feedback.textContent = 'Se abrió el menú para compartir el texto.';
        return;
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      feedback.textContent = 'No se pudo abrir el menú para compartir. Usá las opciones de copia y descarga.';
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      postText.focus();
      postText.select();
      if (document.execCommand) document.execCommand('copy');
    }
    if (photos.length) {
      photos.forEach(function(photo, index) {
        const url = URL.createObjectURL(photo);
        const link = document.createElement('a');
        link.href = url;
        link.download = photo.name || ('foto-prenda-' + (index + 1));
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function() { URL.revokeObjectURL(url); }, 1500 + index * 250);
      });
      feedback.textContent = 'Texto copiado y ' + photos.length + ' fotografía(s) descargada(s). Adjuntalas en Facebook.';
    } else {
      feedback.textContent = 'Texto copiado. Pegalo en Facebook.';
    }
  });

  window.addEventListener('beforeunload', function() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    queuedGarments.forEach(function(item) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  });
}
