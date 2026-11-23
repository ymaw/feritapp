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
