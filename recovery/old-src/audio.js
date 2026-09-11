'use strict';

const SFX = (() => {
  let ctx = null;
  let enabled = true;
  const ensure = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const tone = (freq=440, dur=.08, type='sine', gain=.06, slide=0) => {
    if (!enabled) return;
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq+slide), c.currentTime+dur);
    g.gain.setValueAtTime(.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime+.01);
    g.gain.exponentialRampToValueAtTime(.0001, c.currentTime+dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+dur+.02);
  };
  const noise = (dur=.08, gain=.05) => {
    if (!enabled) return;
    const c = ensure();
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate*dur), c.sampleRate);
    const d = buffer.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
    const s=c.createBufferSource(), g=c.createGain(), f=c.createBiquadFilter();
    s.buffer=buffer; f.type='highpass'; f.frequency.value=700; g.gain.value=gain;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  };
  return {
    get enabled(){return enabled;},
    toggle(){enabled=!enabled; if(enabled) tone(520,.05,'sine',.04); return enabled;},
    tap(){tone(300,.045,'triangle',.025,120);},
    select(i=0){tone(430+i*35,.055,'sine',.035,90);},
    deselect(){tone(260,.045,'triangle',.025,-60);},
    shuffle(){noise(.09,.03); tone(180,.08,'triangle',.025,80);},
    buy(){tone(660,.05,'sine',.04,220); setTimeout(()=>tone(880,.08,'sine',.035,180),45);},
    fail(){tone(160,.18,'sawtooth',.04,-70);},
    win(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.13,'triangle',.04,80),i*70));},
    combo(level=1){
      const f=240+level*55; tone(f,.07,'square',Math.min(.02+.004*level,.055),160+level*20);
      if(level>3) noise(.045,Math.min(.018+level*.002,.04));
    },
    impact(power=1){
      noise(.12,Math.min(.04+power*.005,.09));
      tone(Math.max(55,150-power*4),.16,'sawtooth',Math.min(.035+power*.003,.08),-45);
    },
    explosion(){noise(.32,.10); tone(82,.32,'sawtooth',.065,-35); setTimeout(()=>tone(52,.4,'square',.035,-10),35);}
  };
})();
