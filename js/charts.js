var PetApp = window.PetApp || {};

PetApp.Charts = {
  drawLevelChart: function() {
    var canvas = document.getElementById('levelChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 130 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '130px';
    ctx.scale(dpr, dpr);
    var w = rect.width, h = 130;

    var buckets = PetApp.Logic.getLevelDistribution();
    var labels = ['1-2级','3-4级','5-6级','7-8级','9-10级'];
    var colors = ['#BDC3C7','#3498DB','#E67E22','#E74C3C','#9B59B6'];
    var maxVal = Math.max.apply(null, buckets) || 1;

    ctx.clearRect(0,0,w,h);
    var barW = (w - 40) / 5;
    var chartH = h - 28;

    buckets.forEach(function(v, i) {
      var barH = (v / maxVal) * (chartH - 10);
      var x = 5 + i * barW + barW * 0.15;
      var bw = barW * 0.7;
      var y = chartH - barH;

      ctx.fillStyle = colors[i];
      ctx.beginPath();
      var r = Math.min(4, bw/2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + bw - r, y);
      ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
      ctx.lineTo(x + bw, chartH);
      ctx.lineTo(x, chartH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();

      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v, x + bw/2, y - 3);

      ctx.fillStyle = '#7F8C8D';
      ctx.font = '9px sans-serif';
      ctx.fillText(labels[i], x + bw/2, h - 4);
    });
  },

  drawTypeChart: function() {
    var canvas = document.getElementById('typeChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 130 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '130px';
    ctx.scale(dpr, dpr);
    var w = rect.width, h = 130;

    var counts = PetApp.Logic.getTypeDistribution();
    var total = counts.reduce(function(a,b){ return a+b; },0) || 1;
    var colors = PetApp.CONFIG.PET_TYPES.map(function(t){ return t.color; });

    ctx.clearRect(0,0,w,h);
    var cx = w * 0.32, cy = h / 2, radius = Math.min(cx, cy) - 8;
    var startAngle = -Math.PI / 2;

    counts.forEach(function(count, i) {
      var sliceAngle = (count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    var legendX = w * 0.62;
    var legendY = 10;
    PetApp.CONFIG.PET_TYPES.forEach(function(t, i) {
      ctx.fillStyle = t.color;
      ctx.fillRect(legendX, legendY + i * 20, 10, 10);
      ctx.fillStyle = '#2C3E50';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(t.name + ' ' + counts[i] + '只', legendX + 16, legendY + i * 20 + 9);
    });
  }
};

window.PetApp = PetApp;
