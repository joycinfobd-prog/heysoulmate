// Default (seed) content for new fields. Everything here is editable from /admin.
module.exports = {
  galleryTitle: 'Love Gallery 📸', whatsapp: '01794608874', togetherSince: '', togetherLabel: 'of loving you, and counting 💞',
  quick: ['I love you too 💖', 'তোমাকে ভালোবাসি ❤️', 'Miss you so much 🥺', 'Thank you, you made my day 🥰'],
  hubTitle: 'Our Love Universe 💖', hubSubtitle: 'আমাদের ভালোবাসার সব স্পেশাল বক্স — যেটা খুশি খোলো 🎁',
  boxes: [
    { id: 'birthday', title: 'Happy Birthday Website', subtitle: 'The birthday surprise made just for you', icon: '🎂', kind: 'birthday', theme: 'rose' },
    { id: 'photos', title: 'Photo Letters', subtitle: 'Every photo has its own little letter', icon: '📸', kind: 'photos', theme: 'peach' },
    { id: 'wishes', title: 'Birthday Wishes', subtitle: 'Wishes for your special day', icon: '🎁', kind: 'letters', theme: 'rose', letters: [
      { id: 'w1', emoji: '🎂', title: 'Happy Birthday, my love', body: 'Today the whole world is smiling because you were born. May every wish you make come true, and may I be part of each one.\n\nজন্মদিনের অনেক অনেক ভালোবাসা! 💖' } ] },
    { id: 'miss', title: 'Miss You Letters', subtitle: 'Open one whenever you miss me', icon: '🥺', kind: 'letters', theme: 'lavender', letters: [
      { id: 'm1', emoji: '🥺', title: 'When the distance feels long', body: 'Close your eyes. I’m thinking of you right now, exactly like I do all day.\n\nতোমাকে অনেক মিস করছি… খুব তাড়াতাড়ি আমরা একসাথে থাকব। ❤️' } ] },
    { id: 'openwhen', title: 'Open When…', subtitle: 'A letter for every mood', icon: '💌', kind: 'letters', theme: 'peach', letters: [
      { id: 'o1', emoji: '💌', title: 'My letter to you', body: 'My dearest love,\n\nHappy birthday! Every day with you feels like a gift, but today I want to say it out loud: thank you for being you. You make my ordinary days magical and my bad days softer.\n\nআমার প্রিয় মানুষটা, তুমি আছো বলেই আমার সব দিন সুন্দর। ❤️\n\nForever yours,\nYour Bubu 🧸' },
      { id: 'o2', emoji: '🥺', title: 'Open when you miss me', body: 'Close your eyes and take a deep breath. I’m right here, closer than you think. Hold your pillow tight and imagine my hug around you. 💞' },
      { id: 'o3', emoji: '🌙', title: 'Open when you can’t sleep', body: 'Hey sleepyhead, count my kisses instead of sheep: one, two, three… oh wait, I’ve lost count already. Sweet dreams, my love. 🌙💤' } ] },
    { id: 'fantasy', title: 'Fantasy Box', subtitle: 'Our dreamy little world 🔒', icon: '✨', kind: 'letters', theme: 'midnight', pin: '1234', letters: [
      { id: 'f1', emoji: '✨', title: 'A day in our dream world', body: 'Imagine a small cottage by the sea, rain on the roof, your head on my shoulder and nowhere to be.\n\nআমাদের স্বপ্নের ছোট্ট দুনিয়ায় শুধু তুমি আর আমি। 🌊' } ] },
    { id: 'iwantyou', title: 'How I Want You', subtitle: 'What I dream of with you 🔒', icon: '💞', kind: 'letters', theme: 'midnight', pin: '1234', letters: [
      { id: 'i1', emoji: '💞', title: 'How I want you', body: 'I want you on my loudest and my quietest days. I want your laughter in my mornings and your hand in mine at night. I want you, always — exactly as you are.' } ] }
  ].map(b => ({ subtitle: '', target: '', pin: '', unlockAt: '', lockMessage: '', letters: [], ...b, letters: (b.letters || []).map(l => ({ photoId: '', ...l })) }))
};
