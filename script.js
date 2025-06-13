class FullereneViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMolecule = null;
        this.isWireframe = false;
        this.isAnimating = true;
        this.animationId = null;
        
        this.init();
        this.setupEventListeners();
        this.loadMolecule('c60');
    }
    
    init() {
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // カメラの作成
        const canvas = document.getElementById('three-canvas');
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 15);
        
        // レンダラーの作成
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // ライティング
        this.setupLighting();
        
        // コントロール（マウス操作）
        this.setupControls();
        
        // リサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
        
        // アニメーション開始
        this.animate();
    }
    
    setupLighting() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 指向性ライト
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // ポイントライト
        const pointLight = new THREE.PointLight(0xffa726, 0.5);
        pointLight.position.set(-10, -10, -5);
        this.scene.add(pointLight);
    }
    
    setupControls() {
        // 簡単なマウスコントロール実装
        let mouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let targetRotationX = 0;
        let targetRotationY = 0;
        let currentRotationX = 0;
        let currentRotationY = 0;
        
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        canvas.addEventListener('mouseup', () => {
            mouseDown = false;
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(delta);
        });
        
        // 回転アニメーション
        const updateRotation = () => {
            if (this.currentMolecule) {
                currentRotationX += (targetRotationX - currentRotationX) * 0.1;
                currentRotationY += (targetRotationY - currentRotationY) * 0.1;
                
                this.currentMolecule.rotation.x = currentRotationX;
                this.currentMolecule.rotation.y = currentRotationY;
                
                if (this.isAnimating) {
                    this.currentMolecule.rotation.z += 0.005;
                }
            }
            requestAnimationFrame(updateRotation);
        };
        updateRotation();
    }
    
    createFullerene(type) {
        const group = new THREE.Group();
        
        // 炭素原子のデータ
        const fullereneData = this.getFullereneData(type);
        
        // 原子の作成
        const atomGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const atomMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 100
        });
        
        fullereneData.atoms.forEach(pos => {
            const atom = new THREE.Mesh(atomGeometry, atomMaterial);
            atom.position.set(pos[0], pos[1], pos[2]);
            atom.castShadow = true;
            atom.receiveShadow = true;
            group.add(atom);
        });
        
        // 結合の作成
        fullereneData.bonds.forEach(bond => {
            const start = new THREE.Vector3(...fullereneData.atoms[bond[0]]);
            const end = new THREE.Vector3(...fullereneData.atoms[bond[1]]);
            const direction = new THREE.Vector3().subVectors(end, start);
            const length = direction.length();
            
            const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
            const bondMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                shininess: 50
            });
            
            const bond3D = new THREE.Mesh(bondGeometry, bondMaterial);
            bond3D.position.copy(start.clone().add(direction.clone().multiplyScalar(0.5)));
            bond3D.lookAt(end);
            bond3D.rotateX(Math.PI / 2);
            bond3D.castShadow = true;
            bond3D.receiveShadow = true;
            group.add(bond3D);
        });
        
        return group;
    }
    
    getFullereneData(type) {
        switch(type) {
            case 'c60':
                return this.getC60Data();
            case 'c70':
                return this.getC70Data();
            case 'c84':
                return this.getC84Data();
            default:
                return this.getC60Data();
        }
    }
    
    getC60Data() {
        // C60の簡略化された座標データ
        const atoms = [];
        const bonds = [];
        
        // 正二十面体の頂点を基にC60の座標を生成
        const phi = (1 + Math.sqrt(5)) / 2; // 黄金比
        const scale = 3;
        
        // 12個の頂点（正二十面体）
        const vertices = [
            [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
            [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
            [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
        ];
        
        // 60個の原子座標を生成（簡略化）
        for (let i = 0; i < 60; i++) {
            const theta = (i / 60) * Math.PI * 2;
            const phi = Math.acos(-1 + (2 * i) / 60);
            const x = scale * Math.sin(phi) * Math.cos(theta);
            const y = scale * Math.sin(phi) * Math.sin(theta);
            const z = scale * Math.cos(phi);
            atoms.push([x, y, z]);
        }
        
        // 結合の生成（隣接する原子を結合）
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(atoms[i][0] - atoms[j][0], 2) +
                    Math.pow(atoms[i][1] - atoms[j][1], 2) +
                    Math.pow(atoms[i][2] - atoms[j][2], 2)
                );
                if (dist < 2.5) {
                    bonds.push([i, j]);
                }
            }
        }
        
        return { atoms, bonds };
    }
    
    getC70Data() {
        // C70の座標データ（楕円体状）
        const atoms = [];
        const bonds = [];
        const scale = 3;
        
        for (let i = 0; i < 70; i++) {
            const theta = (i / 70) * Math.PI * 2;
            const phi = Math.acos(-1 + (2 * i) / 70);
            const x = scale * Math.sin(phi) * Math.cos(theta);
            const y = scale * 1.3 * Math.sin(phi) * Math.sin(theta); // 楕円化
            const z = scale * Math.cos(phi);
            atoms.push([x, y, z]);
        }
        
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(atoms[i][0] - atoms[j][0], 2) +
                    Math.pow(atoms[i][1] - atoms[j][1], 2) +
                    Math.pow(atoms[i][2] - atoms[j][2], 2)
                );
                if (dist < 2.8) {
                    bonds.push([i, j]);
                }
            }
        }
        
        return { atoms, bonds };
    }
    
    getC84Data() {
        // C84の座標データ（より大きな球状）
        const atoms = [];
        const bonds = [];
        const scale = 3.5;
        
        for (let i = 0; i < 84; i++) {
            const theta = (i / 84) * Math.PI * 2;
            const phi = Math.acos(-1 + (2 * i) / 84);
            const x = scale * Math.sin(phi) * Math.cos(theta);
            const y = scale * Math.sin(phi) * Math.sin(theta);
            const z = scale * Math.cos(phi);
            atoms.push([x, y, z]);
        }
        
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(atoms[i][0] - atoms[j][0], 2) +
                    Math.pow(atoms[i][1] - atoms[j][1], 2) +
                    Math.pow(atoms[i][2] - atoms[j][2], 2)
                );
                if (dist < 3.0) {
                    bonds.push([i, j]);
                }
            }
        }
        
        return { atoms, bonds };
    }
    
    loadMolecule(type) {
        // 既存の分子を削除
        if (this.currentMolecule) {
            this.scene.remove(this.currentMolecule);
        }
        
        // 新しい分子を作成
        this.currentMolecule = this.createFullerene(type);
        this.scene.add(this.currentMolecule);
        
        // 情報パネルを更新
        this.updateInfoPanel(type);
    }
    
    updateInfoPanel(type) {
        const infoPanel = document.getElementById('molecule-info');
        const infoData = {
            c60: {
                title: 'C₆₀ (バッキーボール)',
                info: [
                    '炭素原子: 60個',
                    '五員環: 12個',
                    '六員環: 20個',
                    '直径: 約1.1nm'
                ]
            },
            c70: {
                title: 'C₇₀',
                info: [
                    '炭素原子: 70個',
                    '五員環: 12個',
                    '六員環: 25個',
                    '形状: 楕円体'
                ]
            },
            c84: {
                title: 'C₈₄',
                info: [
                    '炭素原子: 84個',
                    '五員環: 12個',
                    '六員環: 32個',
                    '直径: 約1.2nm'
                ]
            }
        };
        
        const data = infoData[type];
        infoPanel.innerHTML = `
            <h3>${data.title}</h3>
            <ul>
                ${data.info.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }
    
    setupEventListeners() {
        // 分子選択ボタン
        document.querySelectorAll('.molecule-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // アクティブ状態を更新
                document.querySelectorAll('.molecule-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // 分子を読み込み
                const moleculeType = e.target.dataset.molecule;
                this.loadMolecule(moleculeType);
            });
        });
        
        // 視点リセット
        document.getElementById('reset-view').addEventListener('click', () => {
            this.camera.position.set(0, 0, 15);
            if (this.currentMolecule) {
                this.currentMolecule.rotation.set(0, 0, 0);
            }
        });
        
        // ワイヤーフレーム切り替え
        document.getElementById('toggle-wireframe').addEventListener('click', () => {
            this.isWireframe = !this.isWireframe;
            if (this.currentMolecule) {
                this.currentMolecule.children.forEach(child => {
                    if (child.material) {
                        child.material.wireframe = this.isWireframe;
                    }
                });
            }
        });
        
        // アニメーション切り替え
        document.getElementById('toggle-animation').addEventListener('click', () => {
            this.isAnimating = !this.isAnimating;
        });
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const canvas = document.getElementById('three-canvas');
        const aspect = canvas.clientWidth / canvas.clientHeight;
        
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new FullereneViewer();
});
