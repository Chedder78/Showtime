<script>
  // Prefill from URL like: ?name=John&email=test@example.com
  window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    ['name', 'email', 'phone', 'message'].forEach(id => {
      if (params.has(id)) {
        const field = document.getElementById(id);
        if (field) field.value = params.get(id);
      }
    });
  };

  // On form submit, redirect to prefilled external form
  function handleSubmit(e) {
    e.preventDefault();

    const data = new FormData(e.target);
    const name = data.get('name');
    const email = data.get('email');
    const phone = data.get('phone');
    const message = data.get('message');

    // EXAMPLE: Redirect to external form with values prefilled via query
    const targetUrl = new URL('https://example.com/your-form-handler');
    targetUrl.searchParams.set('name', name);
    targetUrl.searchParams.set('email', email);
    targetUrl.searchParams.set('phone', phone);
    targetUrl.searchParams.set('message', message);

    window.location.href = targetUrl.toString();

    // Alternative: open email with prefilled subject/message
    // window.location.href = `mailto:design@itsshowtime.com?subject=Consultation%20Request&body=Name: ${name}%0AEmail: ${email}%0APhone: ${phone}%0AMessage: ${message}`;
  }
</script>
