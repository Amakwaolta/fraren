class FullereneViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentMolecule = null;
        this.controls = null;
        this.isRotating = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        
        this.init();
        this.setupEventListeners();
        this.animate();
        this.loadMolecule('C60');
    }
    
    init() {
        const container = document.getElementById('canvas-container');
        const canvas = document.getElementById('three-canvas');
        
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // カメラの作成
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 15);
        
        // レンダラーの作成
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // ライティング
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x4499ff, 0.5);
        pointLight.position.set(-10, -10, -5);
        this.scene.add(pointLight);
        
        // リサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupEventListeners() {
        const canvas = document.getElementById('three-canvas');
        
        // マウスイベント
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // タッチイベント
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', () => this.onTouchEnd());
        
        // ボタンイベント
        document.getElementById('c60-btn').addEventListener('click', () => this.switchMolecule('C60'));
        document.getElementById('c70-btn').addEventListener('click', () => this.switchMolecule('C70'));
        document.getElementById('c84-btn').addEventListener('click', () => this.switchMolecule('C84'));
    }
    
    onMouseDown(event) {
        this.isRotating = true;
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }
    
    onMouseMove(event) {
        if (!this.isRotating || !this.currentMolecule) return;
        
        const deltaX = event.clientX - this.mouseX;
        const deltaY = event.clientY - this.mouseY;
        
        this.currentMolecule.rotation.y += deltaX * 0.01;
        this.currentMolecule.rotation.x += deltaY * 0.01;
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }
    
    onMouseUp() {
        this.isRotating = false;
    }
    
    onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            this.isRotating = true;
            this.mouseX = event.touches[0].clientX;
            this.mouseY = event.touches[0].clientY;
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        if (!this.isRotating || !this.currentMolecule || event.touches.length !== 1) return;
        
        const deltaX = event.touches[0].clientX - this.mouseX;
        const deltaY = event.touches[0].clientY - this.mouseY;
        
        this.currentMolecule.rotation.y += deltaX * 0.01;
        this.currentMolecule.rotation.x += deltaY * 0.01;
        
        this.mouseX = event.touches[0].clientX;
        this.mouseY = event.touches[0].clientY;
    }
    
    onTouchEnd() {
        this.isRotating = false;
    }
    
    onWheel(event) {
        event.preventDefault();
        const delta = event.deltaY * 0.01;
        this.camera.position.z += delta;
        this.camera.position.z = Math.max(5, Math.min(30, this.camera.position.z));
    }
    
    createC60() {
        const group = new THREE.Group();
        
        // C60の頂点座標（近似）
        const vertices = [];
        const edges = [];
        
        // 正二十面体の頂点を基にC60を作成
        const phi = (1 + Math.sqrt(5)) / 2; // 黄金比
        const scale = 3;
        
        // 12個の頂点（正二十面体）
        const baseVertices = [
            [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
            [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
            [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
        ];
        
        // 球面上に配置するための追加頂点
        for (let i = 0; i < 60; i++) {
            const theta = (i / 60) * Math.PI * 2;
            const phi = Math.acos(1 - 2 * (i % 12) / 12);
            const x = Math.sin(phi) * Math.cos(theta) * scale;
            const y = Math.sin(phi) * Math.sin(theta) * scale;
            const z = Math.cos(phi) * scale;
            vertices.push(new THREE.Vector3(x, y, z));
        }
        
        // 炭素原子の作成
        const atomGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const atomMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        vertices.forEach(vertex => {
            const atom = new THREE.Mesh(atomGeometry, atomMaterial);
            atom.position.copy(vertex);
            atom.castShadow = true;
            group.add(atom);
        });
        
        // 結合の作成（簡略化）
        const bondGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const distance = vertices[i].distanceTo(vertices[j]);
                if (distance < 2.5) { // 結合距離の閾値
                    const bond = new THREE.Mesh(bondGeometry, bondMaterial);
                    const midpoint = new THREE.Vector3().addVectors(vertices[i], vertices[j]).multiplyScalar(0.5);
                    bond.position.copy(midpoint);
                    bond.lookAt(vertices[j]);
                    bond.rotateX(Math.PI / 2);
                    bond.scale.y = distance;
                    group.add(bond);
                }
            }
        }
        
        return group;
    }
    
    createC70() {
        const group = new THREE.Group();
        
        // C70は楕円体状の構造
        const vertices = [];
        const scale = 3;
        
        // 70個の頂点を楕円体状に配置
        for (let i = 0; i < 70; i++) {
            const theta = (i / 70) * Math.PI * 4;
            const phi = Math.acos(1 - 2 * (i % 14) / 14);
            const x = Math.sin(phi) * Math.cos(theta) * scale;
            const y = Math.sin(phi) * Math.sin(theta) * scale * 1.3; // 楕円形にするため
            const z = Math.cos(phi) * scale;
            vertices.push(new THREE.Vector3(x, y, z));
        }
        
        // 炭素原子の作成
        const atomGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const atomMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        vertices.forEach(vertex => {
            const atom = new THREE.Mesh(atomGeometry, atomMaterial);
            atom.position.copy(vertex);
            atom.castShadow = true;
            group.add(atom);
        });
        
        // 結合の作成
        const bondGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const distance = vertices[i].distanceTo(vertices[j]);
                if (distance < 2.2) {
                    const bond = new THREE.Mesh(bondGeometry, bondMaterial);
                    const midpoint = new THREE.Vector3().addVectors(vertices[i], vertices[j]).multiplyScalar(0.5);
                    bond.position.copy(midpoint);
                    bond.lookAt(vertices[j]);
                    bond.rotateX(Math.PI / 2);
                    bond.scale.y = distance;
                    group.add(bond);
                }
            }
        }
        
        return group;
    }
    
    createC84() {
        const group = new THREE.Group();
        
        // C84はより大きな球状構造
        const vertices = [];
        const scale = 3.5;
        
        // 84個の頂点を球面上に配置
        for (let i = 0; i < 84; i++) {
            const theta = (i / 84) * Math.PI * 6;
            const phi = Math.acos(1 - 2 * (i % 21) / 21);
            const x = Math.sin(phi) * Math.cos(theta) * scale;
            const y = Math.sin(phi) * Math.sin(theta) * scale;
            const z = Math.cos(phi) * scale;
            vertices.push(new THREE.Vector3(x, y, z));
        }
        
        // 炭素原子の作成
        const atomGeometry = new THREE.SphereGeometry(0.14, 16, 16);
        const atomMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        
        vertices.forEach(vertex => {
            const atom = new THREE.Mesh(atomGeometry, atomMaterial);
            atom.position.copy(vertex);
            atom.castShadow = true;
            group.add(atom);
        });
        
        // 結合の作成
        const bondGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
        const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const distance = vertices[i].distanceTo(vertices[j]);
                if (distance < 2.0) {
                    const bond = new THREE.Mesh(bondGeometry, bondMaterial);
                    const midpoint = new THREE.Vector3().addVectors(vertices[i], vertices[j]).multiplyScalar(0.5);
                    bond.position.copy(midpoint);
                    bond.lookAt(vertices[j]);
                    bond.rotateX(Math.PI / 2);
                    bond.scale.y = distance;
                    group.add(bond);
                }
            }
        }
        
        return group;
    }
    
    loadMolecule(type) {
        if (this.currentMolecule) {
            this.scene.remove(this.currentMolecule);
        }
        
        switch (type) {
            case 'C60':
                this.currentMolecule = this.createC60();
                this.updateInfo('C60', 'C60 - バックミンスターフラーレン', 
                    '60個の炭素原子からなる球状分子。サッカーボールのような構造を持ちます。',
                    ['分子式: C₆₀', '対称性: Ih', '発見年: 1985年']);
                break;
            case 'C70':
                this.currentMolecule = this.createC70();
                this.updateInfo('C70', 'C70 - ラグビーボール型フラーレン',
                    '70個の炭素原子からなる楕円体状分子。ラグビーボールのような形状です。',
                    ['分子式: C₇₀', '対称性: D5h', '発見年: 1985年']);
                break;
            case 'C84':
                this.currentMolecule = this.createC84();
                this.updateInfo('C84', 'C84 - 高次フラーレン',
                    '84個の炭素原子からなる大型球状分子。より複雑な対称性を持ちます。',
                    ['分子式: C₈₄', '対称性: D2', '同素体: 24種類']);
                break;
        }
        
        this.scene.add(this.currentMolecule);
    }
    
    updateInfo(type, title, description, details) {
        const infoPanel = document.getElementById('molecule-info');
        infoPanel.innerHTML = `
            <h3>${title}</h3>
            <p>${description}</p>
            <ul>
                ${details.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
        `;
    }
    
    switchMolecule(type) {
        // ボタンの状態更新
        document.querySelectorAll('.fullerene-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(type.toLowerCase() + '-btn').classList.add('active');
        
        // 分子の切り替え
        this.loadMolecule(type);
    }
    
    onWindowResize() {
        const container = document.getElementById('canvas-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 自動回転（ユーザーが操作していない時）
        if (!this.isRotating && this.currentMolecule) {
            this.currentMolecule.rotation.y += 0.005;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new FullereneViewer();
});
