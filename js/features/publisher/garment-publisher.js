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
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const dictationStart = document.getElementById('publisherDictationStart');
  const dictationStop = document.getElementById('publisherDictationStop');
  const transcriptField = document.getElementById('publisherTranscript');
  const dictationStatus = document.getElementById('publisherDictationStatus');
  const useTranscript = document.getElementById('publisherUseTranscript');
  let recognition = null;
  let finalTranscriptParts = [];
  let isDictating = false;

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
      dictationStatus.textContent = messages[event.error] || 'Ocurrió un problema con el reconocimiento de voz. Revisá el texto y volvé a intentar si hace falta.';
    };
    recognition.onend = function() {
      isDictating = false;
      recognition = null;
      dictationStatus.textContent = transcriptField.value.trim()
        ? 'Transcripción lista. Revisala y editá lo que necesites antes de incorporarla.'
        : 'No se obtuvo una transcripción. Podés volver a intentarlo o escribir la descripción.';
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

  useTranscript.addEventListener('click', function() {
    const transcript = transcriptField.value.trim();
    if (!transcript || isDictating) return;
    const observations = document.getElementById('publisherObservations');
    const combined = [observations.value.trim(), transcript].filter(Boolean).join(observations.value.trim() ? '\\n' : '');
    observations.value = combined.slice(0, 1200);
    observations.dispatchEvent(new Event('input', { bubbles: true }));
    observations.focus();
    dictationStatus.textContent = combined.length > 1200
      ? 'Se incorporó la transcripción hasta el límite de 1200 caracteres.'
      : 'Transcripción incorporada a observaciones. Podés seguir editándola.';
  });

  updateDictationControls();

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

  document.getElementById('publisherGenerate').addEventListener('click', function() {
    postText.value = buildGarmentPost(collectData());
    feedback.textContent = 'Plantilla generada. Revisá el texto antes de compartir.';
  });

  photoInput.addEventListener('change', function() {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      photoInput.value = '';
      selectedPhoto = null;
      feedback.textContent = 'Formato no compatible. Elegí una imagen JPG, PNG o WebP.';
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      photoInput.value = '';
      selectedPhoto = null;
      feedback.textContent = 'La imagen supera el límite de 12 MB.';
      return;
    }
    selectedPhoto = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    photoPreview.innerHTML = '';
    const image = document.createElement('img');
    image.src = previewUrl;
    image.alt = 'Vista previa de la fotografía de la prenda';
    photoPreview.appendChild(image);
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
    const shareData = { title: 'Publicación de prenda', text: text };
    if (selectedPhoto) shareData.files = [selectedPhoto];
    try {
      if (selectedPhoto && navigator.canShare && navigator.canShare({ files: shareData.files })) {
        await navigator.share(shareData);
        feedback.textContent = 'Se abrió el menú para compartir texto y fotografía.';
        return;
      }
      if (!selectedPhoto && navigator.share) {
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
    if (selectedPhoto) {
      const url = URL.createObjectURL(selectedPhoto);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedPhoto.name || 'foto-prenda';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      feedback.textContent = 'Texto copiado y fotografía descargada. Adjuntá la imagen en Facebook.';
    } else {
      feedback.textContent = 'Texto copiado. Pegalo en Facebook.';
    }
  });

  window.addEventListener('beforeunload', function() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  });
}
