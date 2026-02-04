'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlogPost } from '@/lib/blog-data';

declare const gsap: any;
declare const THREE: any;

interface LuminaInsightsHeroProps {
    posts: BlogPost[];
}

export function LuminaInsightsHero({ posts }: LuminaInsightsHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentSlugRef = useRef<string>(posts[0]?.slug || '');

    // Store timers and state in refs for proper cleanup
    const cleanupRef = useRef<{
        progressInterval: NodeJS.Timeout | null;
        autoSlideTimeout: NodeJS.Timeout | null;
        renderer: any;
        isActive: boolean;
    }>({
        progressInterval: null,
        autoSlideTimeout: null,
        renderer: null,
        isActive: true,
    });

    useEffect(() => {
        if (posts.length === 0) return;

        // Mark this instance as active
        cleanupRef.current.isActive = true;

        const loadScripts = async () => {
            const loadScript = (src: string, globalName: string) => new Promise<void>((res, rej) => {
                if ((window as any)[globalName]) { res(); return; }
                if (document.querySelector(`script[src="${src}"]`)) {
                    const check = setInterval(() => {
                        if ((window as any)[globalName]) { clearInterval(check); res(); }
                    }, 50);
                    setTimeout(() => { clearInterval(check); rej(new Error(`Timeout waiting for ${globalName}`)); }, 10000);
                    return;
                }
                const s = document.createElement('script');
                s.src = src;
                s.onload = () => { setTimeout(() => res(), 100); };
                s.onerror = () => rej(new Error(`Failed to load ${src}`));
                document.head.appendChild(s);
            });

            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', 'gsap');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE');
            } catch (e) {
                console.error('Failed to load scripts:', e);
                return;
            }

            // Only continue if still active
            if (!cleanupRef.current.isActive) return;
            initApplication();
        };

        const initApplication = async () => {
            const SLIDER_CONFIG: any = {
                settings: {
                    transitionDuration: 2.5, autoSlideSpeed: 6000, currentEffect: "glass",
                    globalIntensity: 1.0, speedMultiplier: 1.0, distortionStrength: 1.0,
                    glassRefractionStrength: 1.0, glassChromaticAberration: 1.0, glassBubbleClarity: 1.0, glassEdgeGlow: 1.0, glassLiquidFlow: 1.0,
                }
            };

            let currentSlideIndex = 0;
            let isTransitioning = false;
            let shaderMaterial: any, renderer: any, scene: any, camera: any;
            let slideTextures: any[] = [];
            let texturesLoaded = false;
            let sliderEnabled = false;

            const SLIDE_DURATION = () => SLIDER_CONFIG.settings.autoSlideSpeed;
            const PROGRESS_UPDATE_INTERVAL = 50;
            const TRANSITION_DURATION = () => SLIDER_CONFIG.settings.transitionDuration;

            const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
            const fragmentShader = `
                uniform sampler2D uTexture1, uTexture2;
                uniform float uProgress;
                uniform vec2 uResolution, uTexture1Size, uTexture2Size;
                uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength;
                uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
                varying vec2 vUv;

                vec2 getCoverUV(vec2 uv, vec2 textureSize) {
                    vec2 s = uResolution / textureSize;
                    float scale = max(s.x, s.y);
                    vec2 scaledSize = textureSize * scale;
                    vec2 offset = (uResolution - scaledSize) * 0.5;
                    return (uv * uResolution - offset) / scaledSize;
                }
                
                vec4 glassEffect(vec2 uv, float progress) {
                    vec2 uv1 = getCoverUV(uv, uTexture1Size);
                    
                    // If progress is very small, just show the current image only
                    if (progress < 0.01) {
                        return texture2D(uTexture1, uv1);
                    }
                    
                    float time = progress * 5.0 * uSpeedMultiplier;
                    vec2 uv2 = getCoverUV(uv, uTexture2Size);
                    float maxR = length(uResolution) * 0.85; 
                    float br = progress * maxR;
                    vec2 p = uv * uResolution; 
                    vec2 c = uResolution * 0.5;
                    float d = length(p - c); 
                    float nd = d / max(br, 0.001);
                    float param = smoothstep(br + 3.0, br - 3.0, d);
                    
                    vec4 img;
                    if (param > 0.0) {
                         float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
                         vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
                         vec2 distUV = uv2 - dir * ro;
                         distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;
                         float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity * pow(smoothstep(0.3, 1.0, nd), 1.2);
                         img = vec4(texture2D(uTexture2, distUV + dir * ca * 1.2).r, texture2D(uTexture2, distUV + dir * ca * 0.2).g, texture2D(uTexture2, distUV - dir * ca * 0.8).b, 1.0);
                         if (uGlassEdgeGlow > 0.0) {
                            float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
                            img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
                         }
                    } else { 
                        img = texture2D(uTexture2, uv2); 
                    }
                    
                    vec4 oldImg = texture2D(uTexture1, uv1);
                    if (progress > 0.95) {
                        img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
                    }
                    return mix(oldImg, img, param);
                }

                void main() {
                    gl_FragColor = glassEffect(vUv, uProgress);
                }
            `;

            const updateShaderUniforms = () => {
                if (!shaderMaterial) return;
                const s = SLIDER_CONFIG.settings, u = shaderMaterial.uniforms;
                for (const key in s) {
                    const uName = 'u' + key.charAt(0).toUpperCase() + key.slice(1);
                    if (u[uName]) u[uName].value = s[key];
                }
            };

            const splitText = (text: string) => {
                return text.split('').map(char => `<span style="display: inline-block; opacity: 0;">${char === ' ' ? '&nbsp;' : char}</span>`).join('');
            };

            const updateContent = (idx: number) => {
                if (!cleanupRef.current.isActive) return;

                const post = posts[idx];
                currentSlugRef.current = post.slug;

                const titleEl = document.getElementById('insightsTitle');
                const descEl = document.getElementById('insightsDesc');
                const categoryEl = document.getElementById('insightsCategory');
                const readBtn = document.getElementById('insightsReadBtn') as HTMLAnchorElement;

                if (titleEl && descEl && categoryEl) {
                    gsap.to(titleEl.children, { y: -20, opacity: 0, duration: 0.5, stagger: 0.02, ease: "power2.in" });
                    gsap.to(descEl, { y: -10, opacity: 0, duration: 0.4, ease: "power2.in" });
                    gsap.to(categoryEl, { y: -10, opacity: 0, duration: 0.3, ease: "power2.in" });

                    setTimeout(() => {
                        if (!cleanupRef.current.isActive) return;

                        titleEl.innerHTML = splitText(post.title);
                        descEl.textContent = post.excerpt;
                        categoryEl.textContent = post.category;
                        if (readBtn) readBtn.href = `/blog/${post.slug}`;

                        gsap.set(titleEl.children, { opacity: 0 });
                        gsap.set(descEl, { y: 20, opacity: 0 });
                        gsap.set(categoryEl, { y: 10, opacity: 0 });

                        const children = titleEl.children;
                        const animations = [
                            () => { gsap.set(children, { y: 20 }); gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "power3.out" }); },
                            () => { gsap.set(children, { y: -20 }); gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "back.out(1.7)" }); },
                            () => { gsap.set(children, { filter: "blur(10px)", scale: 1.5, y: 0 }); gsap.to(children, { filter: "blur(0px)", scale: 1, opacity: 1, duration: 1, stagger: { amount: 0.5, from: "random" }, ease: "power2.out" }); },
                            () => { gsap.set(children, { scale: 0, y: 0 }); gsap.to(children, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.05, ease: "back.out(1.5)" }); },
                            () => { gsap.set(children, { rotationX: 90, y: 0, transformOrigin: "50% 50%" }); gsap.to(children, { rotationX: 0, opacity: 1, duration: 0.8, stagger: 0.04, ease: "power2.out" }); },
                        ];
                        animations[idx % animations.length]();
                        gsap.to(categoryEl, { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: "power3.out" });
                        gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
                    }, 500);
                }
            };

            const stopAllTimers = () => {
                if (cleanupRef.current.progressInterval) {
                    clearInterval(cleanupRef.current.progressInterval);
                    cleanupRef.current.progressInterval = null;
                }
                if (cleanupRef.current.autoSlideTimeout) {
                    clearTimeout(cleanupRef.current.autoSlideTimeout);
                    cleanupRef.current.autoSlideTimeout = null;
                }
            };

            // Reset ALL progress bars to 0
            const resetAllProgress = () => {
                document.querySelectorAll(".insights-slide-progress-fill").forEach((el) => {
                    (el as HTMLElement).style.width = "0%";
                    (el as HTMLElement).style.opacity = "0";
                });
            };

            const updateNavigationState = (idx: number) => {
                document.querySelectorAll(".insights-slide-nav-item").forEach((el, i) => {
                    el.classList.toggle("active", i === idx);
                });
            };

            const updateSlideProgress = (idx: number, prog: number) => {
                const items = document.querySelectorAll(".insights-slide-nav-item");
                // Only update the current slide's progress, reset others
                items.forEach((item, i) => {
                    const el = item.querySelector(".insights-slide-progress-fill") as HTMLElement;
                    if (el) {
                        if (i === idx) {
                            el.style.width = `${prog}%`;
                            el.style.opacity = '1';
                        } else {
                            el.style.width = "0%";
                            el.style.opacity = "0";
                        }
                    }
                });
            };

            const updateCounter = (idx: number) => {
                const sn = document.getElementById("insightsSlideNumber");
                if (sn) sn.textContent = String(idx + 1).padStart(2, "0");
                const st = document.getElementById("insightsSlideTotal");
                if (st) st.textContent = String(posts.length).padStart(2, "0");
            };

            const navigateToSlide = (targetIndex: number) => {
                if (!cleanupRef.current.isActive) return;
                if (isTransitioning || targetIndex === currentSlideIndex) return;

                stopAllTimers();
                resetAllProgress();

                const currentTexture = slideTextures[currentSlideIndex];
                const targetTexture = slideTextures[targetIndex];
                if (!currentTexture || !targetTexture) return;

                isTransitioning = true;
                shaderMaterial.uniforms.uTexture1.value = currentTexture;
                shaderMaterial.uniforms.uTexture2.value = targetTexture;
                shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
                shaderMaterial.uniforms.uTexture2Size.value = targetTexture.userData.size;

                updateContent(targetIndex);
                currentSlideIndex = targetIndex;
                updateCounter(currentSlideIndex);
                updateNavigationState(currentSlideIndex);

                gsap.fromTo(shaderMaterial.uniforms.uProgress,
                    { value: 0 },
                    {
                        value: 1,
                        duration: TRANSITION_DURATION(),
                        ease: "power2.inOut",
                        onComplete: () => {
                            if (!cleanupRef.current.isActive) return;

                            shaderMaterial.uniforms.uProgress.value = 0;
                            shaderMaterial.uniforms.uTexture1.value = targetTexture;
                            shaderMaterial.uniforms.uTexture1Size.value = targetTexture.userData.size;
                            isTransitioning = false;
                            startAutoSlideTimer();
                        }
                    }
                );
            };

            const handleSlideChange = () => {
                if (!cleanupRef.current.isActive) return;
                if (isTransitioning || !texturesLoaded || !sliderEnabled) return;
                navigateToSlide((currentSlideIndex + 1) % posts.length);
            };

            const startAutoSlideTimer = () => {
                if (!cleanupRef.current.isActive) return;
                if (!texturesLoaded || !sliderEnabled) return;

                stopAllTimers();
                resetAllProgress();

                let progress = 0;
                const increment = (100 / SLIDE_DURATION()) * PROGRESS_UPDATE_INTERVAL;

                cleanupRef.current.progressInterval = setInterval(() => {
                    if (!cleanupRef.current.isActive || !sliderEnabled) {
                        stopAllTimers();
                        return;
                    }
                    progress += increment;
                    updateSlideProgress(currentSlideIndex, progress);

                    if (progress >= 100) {
                        stopAllTimers();
                        if (!isTransitioning) handleSlideChange();
                    }
                }, PROGRESS_UPDATE_INTERVAL);
            };

            const createSlidesNavigation = () => {
                const nav = document.getElementById("insightsSlidesNav");
                if (!nav) return;
                nav.innerHTML = "";
                posts.forEach((post, i) => {
                    const item = document.createElement("div");
                    item.className = `insights-slide-nav-item${i === 0 ? " active" : ""}`;
                    item.dataset.slideIndex = String(i);
                    item.innerHTML = `<div class="insights-slide-progress-line"><div class="insights-slide-progress-fill"></div></div><div class="insights-slide-nav-title">${post.category}</div>`;
                    item.addEventListener("click", (e) => {
                        e.stopPropagation();
                        if (!isTransitioning && i !== currentSlideIndex) {
                            navigateToSlide(i);
                        }
                    });
                    nav.appendChild(item);
                });
            };

            const loadImageTexture = (src: string) => new Promise<any>((resolve, reject) => {
                const l = new THREE.TextureLoader();
                l.load(src, (t: any) => {
                    t.minFilter = t.magFilter = THREE.LinearFilter;
                    t.userData = { size: new THREE.Vector2(t.image.width, t.image.height) };
                    resolve(t);
                }, undefined, reject);
            });

            const initRenderer = async () => {
                if (!cleanupRef.current.isActive) return;

                const canvas = document.querySelector(".insights-webgl-canvas") as HTMLCanvasElement;
                if (!canvas) return;

                scene = new THREE.Scene();
                camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                cleanupRef.current.renderer = renderer;

                shaderMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        uTexture1: { value: null }, uTexture2: { value: null }, uProgress: { value: 0 },
                        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                        uTexture1Size: { value: new THREE.Vector2(1, 1) }, uTexture2Size: { value: new THREE.Vector2(1, 1) },
                        uGlobalIntensity: { value: 1.0 }, uSpeedMultiplier: { value: 1.0 }, uDistortionStrength: { value: 1.0 },
                        uGlassRefractionStrength: { value: 1.0 }, uGlassChromaticAberration: { value: 1.0 }, uGlassBubbleClarity: { value: 1.0 }, uGlassEdgeGlow: { value: 1.0 }, uGlassLiquidFlow: { value: 1.0 },
                    },
                    vertexShader, fragmentShader
                });
                scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

                for (const post of posts) {
                    if (!cleanupRef.current.isActive) return;
                    try {
                        slideTextures.push(await loadImageTexture(post.heroImage));
                    } catch {
                        console.warn("Failed texture for:", post.title);
                    }
                }

                if (!cleanupRef.current.isActive) return;

                // Both textures start with the SAME first image
                if (slideTextures.length >= 1) {
                    shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
                    shaderMaterial.uniforms.uTexture2.value = slideTextures[0];
                    shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
                    shaderMaterial.uniforms.uTexture2Size.value = slideTextures[0].userData.size;
                    shaderMaterial.uniforms.uProgress.value = 0;

                    texturesLoaded = true;
                    sliderEnabled = slideTextures.length >= 2;
                    updateShaderUniforms();
                    document.querySelector(".insights-slider-wrapper")?.classList.add("loaded");

                    if (sliderEnabled) {
                        cleanupRef.current.autoSlideTimeout = setTimeout(() => {
                            if (cleanupRef.current.isActive) {
                                startAutoSlideTimer();
                            }
                        }, 2000);
                    }
                }

                const render = () => {
                    if (!cleanupRef.current.isActive) return;
                    requestAnimationFrame(render);
                    if (renderer) renderer.render(scene, camera);
                };
                render();
            };

            createSlidesNavigation();
            updateCounter(0);

            // Init text content
            const tEl = document.getElementById('insightsTitle');
            const dEl = document.getElementById('insightsDesc');
            const cEl = document.getElementById('insightsCategory');
            if (tEl && dEl && cEl && posts[0]) {
                tEl.innerHTML = splitText(posts[0].title);
                dEl.textContent = posts[0].excerpt;
                cEl.textContent = posts[0].category;
                gsap.fromTo(cEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.3 });
                gsap.fromTo(tEl.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.03, ease: "power3.out", delay: 0.5 });
                gsap.fromTo(dEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 });
            }

            initRenderer();

            const handleVisibility = () => {
                if (document.hidden) {
                    stopAllTimers();
                } else if (!isTransitioning && cleanupRef.current.isActive) {
                    startAutoSlideTimer();
                }
            };

            const handleResize = () => {
                if (renderer && shaderMaterial) {
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
                }
            };

            document.addEventListener("visibilitychange", handleVisibility);
            window.addEventListener("resize", handleResize);
        };

        loadScripts();

        // CRITICAL: Cleanup function
        return () => {
            cleanupRef.current.isActive = false;

            if (cleanupRef.current.progressInterval) {
                clearInterval(cleanupRef.current.progressInterval);
                cleanupRef.current.progressInterval = null;
            }
            if (cleanupRef.current.autoSlideTimeout) {
                clearTimeout(cleanupRef.current.autoSlideTimeout);
                cleanupRef.current.autoSlideTimeout = null;
            }
            if (cleanupRef.current.renderer) {
                cleanupRef.current.renderer.dispose();
                cleanupRef.current.renderer = null;
            }
        };
    }, [posts]);

    if (posts.length === 0) return null;

    return (
        <main className="insights-slider-wrapper" ref={containerRef}>
            <canvas className="insights-webgl-canvas"></canvas>

            {/* Dark overlay for text readability - matching home page style */}
            <div
                className="absolute inset-0 z-[2]"
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.35) 100%)'
                }}
            />

            <span className="insights-slide-number" id="insightsSlideNumber">01</span>
            <span className="insights-slide-total" id="insightsSlideTotal">05</span>

            <div className="insights-slide-content">
                <p className="insights-slide-category" id="insightsCategory"></p>
                <h1 className="insights-slide-title" id="insightsTitle"></h1>
                <p className="insights-slide-description" id="insightsDesc"></p>
                <Link
                    href={`/blog/${posts[0]?.slug}`}
                    id="insightsReadBtn"
                    className="insights-read-btn"
                >
                    Read Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
            </div>

            <nav className="insights-slides-navigation" id="insightsSlidesNav"></nav>
        </main>
    );
}

export default LuminaInsightsHero;
