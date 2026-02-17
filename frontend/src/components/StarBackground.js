import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const StarBackground = ({ active }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let stars = [];
    let shootingStar = null;
    
    // Config
    const starCount = 400;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    class Star {
      constructor() {
        this.reset(true);
      }
      
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.depth = Math.random(); // 0 = far, 1 = near
        
        // Refined Size Logic: drastically smaller stars
        // Distant stars are tiny points (0.5 - 1.0)
        // Near stars are slightly larger but still small (max 1.5)
        // No more "planets"
        this.baseSize = (Math.random() * 0.8 + 0.2) * (this.depth * 0.5 + 0.5); 
        
        this.color = ['255, 255, 255', '200, 220, 255', '255, 250, 220'][Math.floor(Math.random() * 3)];
        
        // Twinkle
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
      }
      
      update() {
        // Static mode: just twinkle
        this.twinklePhase += this.twinkleSpeed;
      }
      
      draw() {
        // Normal Star Drawing
        const size = this.baseSize;
        
        // Twinkle calculation
        const twinkle = Math.sin(this.twinklePhase);
        const alpha = 0.5 + (twinkle * 0.4); // slightly more contrast in twinkle

        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        
        // Subtle glow only for the very closest/largest stars
        if (this.depth > 0.9) {
            ctx.shadowBlur = 2;
            ctx.shadowColor = `rgba(${this.color}, ${alpha})`;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
        ctx.fill();
      }
    }

    class ShootingStar {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * (canvas.height / 2);
            this.length = Math.random() * 80 + 10;
            this.speed = Math.random() * 10 + 10;
            this.size = Math.random() * 1 + 0.1;
            this.angle = (Math.random() * 30 + 30) * (Math.PI / 180); 
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.opacity = 0;
            this.active = true;
            this.fadingIn = true;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.fadingIn) {
                this.opacity += 0.1;
                if (this.opacity >= 1) this.fadingIn = false;
            } else {
                this.opacity -= 0.02;
            }
            if (this.opacity < 0 || this.x > canvas.width || this.y > canvas.height) {
                this.active = false;
            }
        }

        draw() {
            if (!this.active) return;
            const tailX = this.x - this.vx * (this.length / this.speed);
            const tailY = this.y - this.vy * (this.length / this.speed);
            const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.size;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }
    
    const init = () => {
      resizeCanvas();
      stars = Array.from({ length: starCount }, () => new Star());
    };
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.update();
        star.draw();
      });

      if (active) {
          if (!shootingStar && Math.random() < 0.003) {
              shootingStar = new ShootingStar();
          }
          if (shootingStar) {
              shootingStar.update();
              shootingStar.draw();
              if (!shootingStar.active) shootingStar = null;
          }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    init();
    render();
    
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]); 

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: active ? 1 : 0,
        transition: 'opacity 3s ease-in-out',
        background: 'radial-gradient(circle at bottom, #0b1021 0%, #000000 100%)' 
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </Box>
  );
};

export default StarBackground;
