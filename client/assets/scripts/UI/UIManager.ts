import {
    Node, UITransform, Graphics, Label, Color,
    Button, UIOpacity, tween, Tween, EditBox, Sprite, SpriteFrame, ImageAsset, Vec3,
    Layers, VerticalTextAlignment, ScrollView, Layout
} from 'cc';
import { FoodItemData, PetType, PET_DEFINITIONS, MEDAL_DEFINITIONS, SHOP_ITEMS, ShopItemData, MedalData, PlayerMedalData, GrowthStage, StudentData, PetData, UpgradePath } from '../Pet/PetData';
import { EffectManager } from '../Effect/EffectManager';

export interface UICallbacks {
    onSelectStudent: (studentId: string) => void;
    onTease: () => void;
    onPlay: () => void;
    onSleep: () => void;
    onFeed: () => void;
    onShopPurchase: (itemId: string) => void;
    onHeal: (amount: number) => void;
    onRevive: () => void;
    onAddStudent: (name: string) => void;
    onDeleteStudent: (studentId: string) => void;
    onRenamePet: (name: string) => void;
    onUploadPetImage: (imageDataUrl: string) => void;
    onSetUpgradePath: (pathId: string) => void;
    onTeacherAddDiamond: (amount: number) => void;
    onTeacherReduceDiamond: (amount: number) => void;
    onTeacherAddMedal: (medalId: string) => void;
    onTeacherTransferDiamond: (fromStudentId: string, toStudentId: string, amount: number) => void;
    onBatchDiamond: (studentIds: string[], amount: number, action: string) => void;
    onBatchMedal: (studentIds: string[], medalId: string) => void;
    onCreatePet: (studentId: string, customName: string, petType: PetType) => void;
}

export class UIManager {
    private readonly W = 960;
    private readonly H = 640;
    private readonly EXP_BAR_W = 160;
    private readonly EXP_BAR_H = 14;

    private rootNode: Node;
    private callbacks: UICallbacks;

    private penguinArea: Node = null!;
    private topBarNode: Node = null!;
    private studentNameLabel: Label = null!;
    private petNameLabel: Label = null!;
    private switchStudentBtn: Node = null!;

    private levelLabel: Label = null!;
    private expBarFill: Graphics = null!;
    private expLabel: Label = null!;
    private hungerBarFill: Graphics = null!;
    private happinessBarFill: Graphics = null!;
    private healthBarFill: Graphics = null!;
    private hungerLabel: Label = null!;
    private happinessLabel: Label = null!;
    private healthLabel: Label = null!;
    private diamondLabel: Label = null!;
    private medalLabel: Label = null!;

    private studentBarNode: Node = null!;
    private studentBarContent: Node = null!;

    private studentListPanel: Node = null!;
    private studentListContent: Node = null!;

    private foodPanel: Node = null!;
    private foodListContent: Node = null!;
    private foodBalanceLabel: Label = null!;

    private shopPanel: Node = null!;
    private shopListContent: Node = null!;
    private shopCategory: string = 'food';
    private shopCategoryBtns: { node: Node; category: string }[] = [];

    private rankPanel: Node = null!;
    private rankListContent: Node = null!;

    private medalPanel: Node = null!;
    private medalListContent: Node = null!;

    private medicalPanel: Node = null!;
    private medicalHealthLabel: Label = null!;
    private medicalStatusLabel: Label = null!;
    private reviveBtn: Node = null!;

    private teacherPanel: Node = null!;
    private teacherVerified: boolean = false;
    private teacherContentNode: Node = null!;
    private teacherPasswordEdit: EditBox = null!;
    private teacherTab: string = 'diamond';
    private teacherTabContent: Node = null!;
    private teacherAddDiamondEdit: EditBox = null!;
    private teacherReduceDiamondEdit: EditBox = null!;
    private teacherSelectedMedalId: string = '';
    private teacherFromStudentEdit: EditBox = null!;
    private teacherToStudentEdit: EditBox = null!;
    private teacherTransferAmountEdit: EditBox = null!;
    private teacherBatchAmountEdit: EditBox = null!;
    private teacherBatchStudentChecks: Map<string, boolean> = new Map();
    private teacherStudents: StudentData[] = [];

    private petSettingsPanel: Node = null!;
    private petNameEdit: EditBox = null!;
    private upgradePathDropdown: Node = null!;
    private upgradePathLabel: Label = null!;
    private currentUpgradePaths: UpgradePath[] = [];

    private addStudentPanel: Node = null!;
    private addStudentNameEdit: EditBox = null!;

    private createPetPanel: Node = null!;
    private createPetStudentId: string = '';
    private createPetNameEdit: EditBox = null!;
    private createPetSelectedType: PetType = PetType.PENGUIN;

    private toastNode: Node = null!;
    private toastLabel: Label = null!;
    private toastTween: Tween<Node> | null = null;
    private currentHealth: number = 100;
    private currentHealthStatus: string = '健康';

    private effectManager: EffectManager | null = null;
    private students: StudentData[] = [];
    private currentStudent: StudentData | null = null;
    private currentPet: PetData | null = null;

    constructor(rootNode: Node, callbacks: UICallbacks) {
        this.rootNode = rootNode;
        this.callbacks = callbacks;
    }

    createUI(): void {
        this.createBackground();
        this.penguinArea = this.createPenguinArea();
        this.createTopBar();
        this.createStatusBar();
        this.createActionBar();
        this.createStudentBar();
        this.createStudentListPanel();
        this.createFoodPanel();
        this.createShopPanel();
        this.createRankPanel();
        this.createMedalPanel();
        this.createMedicalPanel();
        this.createTeacherPanel();
        this.createPetSettingsPanel();
        this.createAddStudentPanel();
        this.createCreatePetPanel();
        this.createToast();
    }

    getPenguinArea(): Node {
        return this.penguinArea;
    }

    setFoodSystem(fs: any): void {}
    setMedalSystem(ms: any): void {}
    setEffectManager(em: EffectManager): void {
        this.effectManager = em;
    }

    setStudents(students: StudentData[]): void {
        this.students = students;
        this.updateStudentBar(students, this.currentStudent?.studentId || '');
        if (this.studentListPanel && this.studentListPanel.active) {
            this.refreshStudentList();
        }
    }

    setCurrentStudent(student: StudentData | null): void {
        this.currentStudent = student;
        if (this.studentNameLabel) {
            this.studentNameLabel.string = student ? student.name : '未选择';
        }
        this.updateStudentBar(this.students, student?.studentId || '');
    }

    setCurrentPet(pet: PetData | null): void {
        this.currentPet = pet;
        if (this.petNameLabel) {
            this.petNameLabel.string = pet ? pet.customName : '无宠物';
        }
    }

    updateStatusBar(
        stageName: string, expProgress: number,
        foodCount: number,
        hunger: number, happiness: number,
        health: number, diamond: number, medalCount: number
    ): void {
        if (this.levelLabel) this.levelLabel.string = stageName;
        if (this.expLabel) this.expLabel.string = `${Math.floor(expProgress * 100)}%`;
        if (this.hungerLabel) this.hungerLabel.string = `${Math.floor(hunger)}`;
        if (this.happinessLabel) this.happinessLabel.string = `${Math.floor(happiness)}`;
        if (this.healthLabel) this.healthLabel.string = `${Math.floor(health)}`;
        if (this.diamondLabel) this.diamondLabel.string = `💎${diamond}`;
        if (this.medalLabel) this.medalLabel.string = `🏅${medalCount}`;
        this.drawExpBar(expProgress);
        this.drawHungerBar(hunger / 100);
        this.drawHappinessBar(happiness / 100);
        this.drawHealthBar(health / 100);
        this.currentHealth = health;
        if (health > 60) this.currentHealthStatus = '健康';
        else if (health > 30) this.currentHealthStatus = '饥饿';
        else if (health > 10) this.currentHealthStatus = '生病';
        else this.currentHealthStatus = '危险';
    }

    updateStudentBar(studentList: StudentData[], currentId: string): void {
        this.students = studentList;
        if (!this.studentBarContent) return;
        this.studentBarContent.removeAllChildren();
        const avatarSize = 48;
        const gap = 10;
        const startX = -(studentList.length * (avatarSize + gap) + avatarSize + gap) / 2 + avatarSize / 2;

        for (let i = 0; i < studentList.length; i++) {
            const s = studentList[i];
            const x = startX + i * (avatarSize + gap);
            const isSelected = s.studentId === currentId;
            const avatarNode = this.createAvatarButton(this.studentBarContent, s, x, 0, avatarSize, isSelected);
        }

        const addX = startX + studentList.length * (avatarSize + gap);
        this.makeButton(this.studentBarContent, '+', new Color(200, 200, 210, 255), avatarSize, avatarSize, addX, 0, () => {
            this.showAddStudentPanel();
        });
    }

    private createAvatarButton(parent: Node, student: StudentData, x: number, y: number, size: number, selected: boolean): Node {
        const node = new Node(`Avatar_${student.studentId}`);
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(size, size);

        const g = node.addComponent(Graphics);
        if (selected) {
            g.strokeColor = new Color(100, 180, 255, 255);
            g.lineWidth = 3;
            g.circle(0, 0, size / 2);
            g.stroke();
        }
        g.fillColor = new Color(230, 235, 245, 255);
        g.circle(0, 0, size / 2 - (selected ? 3 : 0));
        g.fill();

        const lblNode = new Node('Initial');
        node.addChild(lblNode);
        lblNode.addComponent(UITransform).setContentSize(size, size);
        const lbl = lblNode.addComponent(Label);
        lbl.string = student.name.charAt(0);
        lbl.fontSize = 18;
        lbl.color = new Color(80, 100, 140, 255);
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        const btn = node.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.92;
        btn.duration = 0.08;

        node.on(Node.EventType.TOUCH_END, (ev: any) => {
            ev.propagationStopped = true;
            this.callbacks.onSelectStudent(student.studentId);
        }, this);

        return node;
    }

    showStudentList(): void {
        if (!this.studentListPanel) return;
        this.refreshStudentList();
        this.studentListPanel.active = true;
        const op = this.studentListPanel.getComponent(UIOpacity) || this.studentListPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideStudentList(): void {
        if (this.studentListPanel) this.studentListPanel.active = false;
    }

    showFoodPanel(): void {
        if (!this.foodPanel) return;
        this.refreshFoodList();
        this.foodPanel.active = true;
        const op = this.foodPanel.getComponent(UIOpacity) || this.foodPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideFoodPanel(): void {
        if (this.foodPanel) this.foodPanel.active = false;
    }

    showShopPanel(): void {
        if (!this.shopPanel) return;
        this.refreshShopList();
        this.shopPanel.active = true;
        const op = this.shopPanel.getComponent(UIOpacity) || this.shopPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideShopPanel(): void {
        if (this.shopPanel) this.shopPanel.active = false;
    }

    refreshShopList(category?: string): void {
        if (category) {
            this.shopCategory = category;
        }
        this.updateShopTabs();
        if (!this.shopListContent) return;
        this.shopListContent.removeAllChildren();
        const items = SHOP_ITEMS.filter(i => i.category === this.shopCategory);
        const startY = 0;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const y = startY - i * 70;
            this.createShopItemCard(this.shopListContent, item, y);
        }
    }

    showRankPanel(rankData: { name: string; totalExp: number; stage: GrowthStage }[]): void {
        if (!this.rankPanel) return;
        this.refreshRankList(rankData);
        this.rankPanel.active = true;
        const op = this.rankPanel.getComponent(UIOpacity) || this.rankPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideRankPanel(): void {
        if (this.rankPanel) this.rankPanel.active = false;
    }

    refreshRankList(rankData: { name: string; totalExp: number; stage: GrowthStage }[]): void {
        if (!this.rankListContent) return;
        this.rankListContent.removeAllChildren();
        const stageNames = ['蛋蛋', '幼年', '少年', '成年', '传说'];
        for (let i = 0; i < rankData.length; i++) {
            const entry = rankData[i];
            const y = -i * 55;
            this.createRankEntryCard(this.rankListContent, entry.name, entry.totalExp, entry.stage, i + 1, y, stageNames);
        }
    }

    showMedalPanel(medals: PlayerMedalData[]): void {
        if (!this.medalPanel) return;
        this.refreshMedalList(medals);
        this.medalPanel.active = true;
        const op = this.medalPanel.getComponent(UIOpacity) || this.medalPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideMedalPanel(): void {
        if (this.medalPanel) this.medalPanel.active = false;
    }

    refreshMedalList(medals: PlayerMedalData[]): void {
        if (!this.medalListContent) return;
        this.medalListContent.removeAllChildren();
        const earnedIds = medals.map(m => m.medalId);
        const cols = 2;
        const cardW = 260;
        const cardH = 90;
        const gap = 12;
        const startX = -(cols * (cardW + gap) - gap) / 2 + cardW / 2;
        const startY = 0;
        for (let i = 0; i < MEDAL_DEFINITIONS.length; i++) {
            const medal = MEDAL_DEFINITIONS[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY - row * (cardH + gap);
            const earned = earnedIds.includes(medal.id);
            this.createMedalCard(this.medalListContent, medal, earned, x, y, cardW, cardH);
        }
    }

    showMedicalPanel(): void {
        if (!this.medicalPanel) return;
        if (this.medicalHealthLabel) this.medicalHealthLabel.string = `健康值: ${Math.floor(this.currentHealth)}/100`;
        if (this.medicalStatusLabel) {
            this.medicalStatusLabel.string = `状态: ${this.currentHealthStatus}`;
            if (this.currentHealth <= 0) {
                this.medicalStatusLabel.color = new Color(200, 50, 50, 255);
            } else if (this.currentHealth < 30) {
                this.medicalStatusLabel.color = new Color(200, 120, 50, 255);
            } else {
                this.medicalStatusLabel.color = new Color(50, 180, 80, 255);
            }
        }
        if (this.reviveBtn) this.reviveBtn.active = this.currentHealth <= 0;
        this.medicalPanel.active = true;
        const op = this.medicalPanel.getComponent(UIOpacity) || this.medicalPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideMedicalPanel(): void {
        if (this.medicalPanel) this.medicalPanel.active = false;
    }

    showTeacherPanel(students: StudentData[]): void {
        if (!this.teacherPanel) return;
        this.teacherStudents = students;
        this.teacherVerified = false;
        if (this.teacherContentNode) this.teacherContentNode.active = false;
        if (this.teacherPasswordEdit) this.teacherPasswordEdit.string = '';
        this.resetTeacherPwdArea();
        this.teacherPanel.active = true;
        const op = this.teacherPanel.getComponent(UIOpacity) || this.teacherPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideTeacherPanel(): void {
        if (this.teacherPanel) this.teacherPanel.active = false;
    }

    private hideTeacherPwdArea(): void {
        if (this.teacherPwdArea) {
            this.teacherPwdArea.active = false;
            this.teacherPwdArea.removeAllChildren();
        }
        if (this.teacherVerifyBtn) {
            this.teacherVerifyBtn.active = false;
            this.teacherVerifyBtn = null;
        }
        if (this.teacherPasswordEdit) {
            this.teacherPasswordEdit.string = '';
        }
    }

    private resetTeacherPwdArea(): void {
        if (!this.teacherPwdArea) return;
        this.teacherPwdArea.removeAllChildren();
        this.teacherPwdArea.active = true;
        this.teacherVerifyBtn = null;

        const pwdLabelNode = new Node('PwdLabel');
        this.teacherPwdArea.addChild(pwdLabelNode);
        pwdLabelNode.setPosition(-220, 18, 0);
        pwdLabelNode.addComponent(UITransform).setContentSize(90, 30);
        const pwdLbl = pwdLabelNode.addComponent(Label);
        pwdLbl.string = '密码:';
        pwdLbl.fontSize = 18;
        pwdLbl.color = new Color(50, 50, 65, 255);
        pwdLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        const pwdEditNode = new Node('PasswordEdit');
        this.teacherPwdArea.addChild(pwdEditNode);
        pwdEditNode.setPosition(-20, 0, 0);
        this.teacherPasswordEdit = this.makeEditBox(this.teacherPwdArea, 240, 36, -20, 0, '请输入教师密码', EditBox.InputMode.ANY, EditBox.InputFlag.PASSWORD, 16);

        this.teacherVerifyBtn = this.makeButton(this.teacherPwdArea, '验证', new Color(80, 160, 245, 255), 86, 36, 200, 0, () => {
            if (this.teacherPasswordEdit && this.teacherPasswordEdit.string === '123456') {
                this.teacherVerified = true;
                this.hideTeacherPwdArea();
                if (this.teacherContentNode) this.teacherContentNode.active = true;
                this.showToast('验证成功');
                this.refreshTeacherTab();
            } else {
                this.showToast('密码错误');
            }
        });
    }

    showPetSettings(upgradePaths: UpgradePath[]): void {
        if (!this.petSettingsPanel) return;
        this.currentUpgradePaths = upgradePaths;
        if (this.petNameEdit && this.currentPet) {
            this.petNameEdit.string = this.currentPet.customName;
        }
        this.refreshUpgradePathDropdown(upgradePaths);
        this.petSettingsPanel.active = true;
        const op = this.petSettingsPanel.getComponent(UIOpacity) || this.petSettingsPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hidePetSettings(): void {
        if (this.petSettingsPanel) this.petSettingsPanel.active = false;
    }

    showAddStudentPanel(): void {
        if (!this.addStudentPanel) return;
        if (this.addStudentNameEdit) this.addStudentNameEdit.string = '';
        this.addStudentPanel.active = true;
        const op = this.addStudentPanel.getComponent(UIOpacity) || this.addStudentPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideAddStudentPanel(): void {
        if (this.addStudentPanel) this.addStudentPanel.active = false;
    }

    showCreatePetPanel(studentId: string): void {
        if (!this.createPetPanel) return;
        this.createPetStudentId = studentId;
        this.createPetSelectedType = PetType.PENGUIN;
        if (this.createPetNameEdit) this.createPetNameEdit.string = '';
        this.refreshCreatePetSelection();
        this.createPetPanel.active = true;
        const op = this.createPetPanel.getComponent(UIOpacity) || this.createPetPanel.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.25, { opacity: 255 }).start();
    }

    hideCreatePetPanel(): void {
        if (this.createPetPanel) this.createPetPanel.active = false;
    }

    showToast(message: string): void {
        if (!this.toastNode || !this.toastLabel) return;
        if (this.toastTween) { this.toastTween.stop(); this.toastTween = null; }
        this.toastLabel.string = message;
        this.toastNode.active = true;
        const op = this.toastNode.getComponent(UIOpacity) || this.toastNode.addComponent(UIOpacity);
        op.opacity = 255;
        this.toastTween = tween(op)
            .delay(1.8)
            .to(0.5, { opacity: 0 })
            .call(() => { this.toastNode.active = false; })
            .start();
    }

    private createBackground(): void {
        const bgNode = new Node('Background');
        this.rootNode.addChild(bgNode);
        const t = bgNode.addComponent(UITransform);
        t.setContentSize(this.W, this.H);
        const g = bgNode.addComponent(Graphics);
        g.fillColor = new Color(220, 238, 250, 255);
        g.rect(-this.W / 2, -this.H / 2, this.W, this.H);
        g.fill();
        g.fillColor = new Color(200, 230, 250, 255);
        g.rect(-this.W / 2, -this.H / 2, this.W, this.H * 0.35);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 100);
        this.drawCloud(g, -300, 250, 1.0);
        this.drawCloud(g, 100, 280, 0.7);
        this.drawCloud(g, -100, 220, 0.5);
        this.drawCloud(g, 280, 240, 0.6);
        g.fillColor = new Color(160, 210, 160, 255);
        g.ellipse(0, -280, 480, 60);
        g.fill();
        g.fillColor = new Color(140, 200, 140, 255);
        g.ellipse(-150, -290, 240, 40);
        g.fill();
        g.ellipse(180, -285, 220, 38);
        g.fill();
        g.fillColor = new Color(255, 220, 100, 60);
        g.circle(400, 270, 45);
        g.fill();
        g.fillColor = new Color(255, 230, 130, 40);
        g.circle(400, 270, 65);
        g.fill();
    }

    private drawCloud(g: Graphics, x: number, y: number, scale: number): void {
        const s = scale;
        g.circle(x, y, 30 * s);
        g.fill();
        g.circle(x - 25 * s, y - 5 * s, 22 * s);
        g.fill();
        g.circle(x + 28 * s, y - 3 * s, 25 * s);
        g.fill();
        g.circle(x + 10 * s, y + 8 * s, 20 * s);
        g.fill();
    }

    private createPenguinArea(): Node {
        const area = new Node('PenguinArea');
        this.rootNode.addChild(area);
        const t = area.addComponent(UITransform);
        t.setContentSize(340, 440);
        area.setPosition(-200, 20, 0);
        return area;
    }

    private createTopBar(): void {
        this.topBarNode = new Node('TopBar');
        this.rootNode.addChild(this.topBarNode);
        const t = this.topBarNode.addComponent(UITransform);
        t.setContentSize(600, 48);
        this.topBarNode.setPosition(200, 260, 0);

        const bg = this.topBarNode.addComponent(Graphics);
        bg.fillColor = new Color(255, 255, 255, 215);
        bg.roundRect(-300, -24, 600, 48, 12);
        bg.fill();

        const stuNode = new Node('StudentName');
        this.topBarNode.addChild(stuNode);
        stuNode.setPosition(-200, 0, 0);
        stuNode.addComponent(UITransform).setContentSize(140, 28);
        this.studentNameLabel = stuNode.addComponent(Label);
        this.studentNameLabel.string = '未选择';
        this.studentNameLabel.fontSize = 18;
        this.studentNameLabel.color = new Color(60, 60, 80, 255);
        this.studentNameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

        const sepNode = new Node('Sep');
        this.topBarNode.addChild(sepNode);
        sepNode.setPosition(-100, 0, 0);
        sepNode.addComponent(UITransform).setContentSize(20, 28);
        const sepLbl = sepNode.addComponent(Label);
        sepLbl.string = '→';
        sepLbl.fontSize = 16;
        sepLbl.color = new Color(160, 160, 170, 255);
        sepLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const petNode = new Node('PetName');
        this.topBarNode.addChild(petNode);
        petNode.setPosition(0, 0, 0);
        petNode.addComponent(UITransform).setContentSize(140, 28);
        this.petNameLabel = petNode.addComponent(Label);
        this.petNameLabel.string = '无宠物';
        this.petNameLabel.fontSize = 18;
        this.petNameLabel.color = new Color(100, 160, 255, 255);
        this.petNameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

        this.switchStudentBtn = this.makeButton(this.topBarNode, '切换', new Color(120, 180, 230, 255), 80, 36, 230, 0, () => {
            this.showStudentList();
        });
    }

    private createStatusBar(): void {
        const bar = new Node('StatusBar');
        this.rootNode.addChild(bar);
        const t = bar.addComponent(UITransform);
        t.setContentSize(600, 200);
        bar.setPosition(200, 120, 0);

        const bg = bar.addComponent(Graphics);
        bg.fillColor = new Color(255, 255, 255, 190);
        bg.roundRect(-300, -100, 600, 200, 16);
        bg.fill();

        const lvlNode = new Node('LevelLabel');
        bar.addChild(lvlNode);
        lvlNode.setPosition(-260, 75, 0);
        lvlNode.addComponent(UITransform).setContentSize(80, 26);
        this.levelLabel = lvlNode.addComponent(Label);
        this.levelLabel.string = '蛋蛋';
        this.levelLabel.fontSize = 20;
        this.levelLabel.color = new Color(60, 60, 80, 255);
        this.levelLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        const expBgNode = new Node('ExpBarBg');
        bar.addChild(expBgNode);
        expBgNode.setPosition(-110, 75, 0);
        expBgNode.addComponent(UITransform).setContentSize(this.EXP_BAR_W, this.EXP_BAR_H);
        const expBg = expBgNode.addComponent(Graphics);
        expBg.fillColor = new Color(220, 220, 220, 255);
        expBg.roundRect(-this.EXP_BAR_W / 2, -this.EXP_BAR_H / 2, this.EXP_BAR_W, this.EXP_BAR_H, this.EXP_BAR_H / 2);
        expBg.fill();

        const expFillNode = new Node('ExpBarFill');
        bar.addChild(expFillNode);
        expFillNode.setPosition(-110, 75, 0);
        expFillNode.addComponent(UITransform).setContentSize(this.EXP_BAR_W, this.EXP_BAR_H);
        this.expBarFill = expFillNode.addComponent(Graphics);

        const expLblNode = new Node('ExpLabel');
        bar.addChild(expLblNode);
        expLblNode.setPosition(40, 75, 0);
        expLblNode.addComponent(UITransform).setContentSize(50, 22);
        this.expLabel = expLblNode.addComponent(Label);
        this.expLabel.string = '0%';
        this.expLabel.fontSize = 16;
        this.expLabel.color = new Color(180, 150, 50, 255);
        this.expLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        const diamondNode = new Node('DiamondLabel');
        bar.addChild(diamondNode);
        diamondNode.setPosition(140, 75, 0);
        diamondNode.addComponent(UITransform).setContentSize(80, 22);
        this.diamondLabel = diamondNode.addComponent(Label);
        this.diamondLabel.string = '💎0';
        this.diamondLabel.fontSize = 16;
        this.diamondLabel.color = new Color(80, 160, 255, 255);
        this.diamondLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        const medalNode = new Node('MedalLabel');
        bar.addChild(medalNode);
        medalNode.setPosition(230, 75, 0);
        medalNode.addComponent(UITransform).setContentSize(70, 22);
        this.medalLabel = medalNode.addComponent(Label);
        this.medalLabel.string = '🏅0';
        this.medalLabel.fontSize = 16;
        this.medalLabel.color = new Color(200, 160, 50, 255);
        this.medalLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        const hungerTitleNode = new Node('HungerTitle');
        bar.addChild(hungerTitleNode);
        hungerTitleNode.setPosition(-260, 12, 0);
        hungerTitleNode.addComponent(UITransform).setContentSize(44, 20);
        const hungerTitle = hungerTitleNode.addComponent(Label);
        hungerTitle.string = '饱食';
        hungerTitle.fontSize = 15;
        hungerTitle.color = new Color(120, 120, 120, 255);
        hungerTitle.horizontalAlign = Label.HorizontalAlign.LEFT;

        const hungerBgNode = new Node('HungerBarBg');
        bar.addChild(hungerBgNode);
        hungerBgNode.setPosition(-100, 12, 0);
        hungerBgNode.addComponent(UITransform).setContentSize(160, 11);
        const hungerBg = hungerBgNode.addComponent(Graphics);
        hungerBg.fillColor = new Color(230, 230, 230, 255);
        hungerBg.roundRect(-80, -5.5, 160, 11, 5.5);
        hungerBg.fill();

        const hungerFillNode = new Node('HungerBarFill');
        bar.addChild(hungerFillNode);
        hungerFillNode.setPosition(-100, 12, 0);
        hungerFillNode.addComponent(UITransform).setContentSize(160, 11);
        this.hungerBarFill = hungerFillNode.addComponent(Graphics);

        const hungerValNode = new Node('HungerVal');
        bar.addChild(hungerValNode);
        hungerValNode.setPosition(82, 12, 0);
        hungerValNode.addComponent(UITransform).setContentSize(36, 18);
        this.hungerLabel = hungerValNode.addComponent(Label);
        this.hungerLabel.string = '80';
        this.hungerLabel.fontSize = 13;
        this.hungerLabel.color = new Color(120, 120, 120, 255);
        this.hungerLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        const happyTitleNode = new Node('HappyTitle');
        bar.addChild(happyTitleNode);
        happyTitleNode.setPosition(-260, -14, 0);
        happyTitleNode.addComponent(UITransform).setContentSize(44, 20);
        const happyTitle = happyTitleNode.addComponent(Label);
        happyTitle.string = '心情';
        happyTitle.fontSize = 15;
        happyTitle.color = new Color(120, 120, 120, 255);
        happyTitle.horizontalAlign = Label.HorizontalAlign.LEFT;

        const happyBgNode = new Node('HappyBarBg');
        bar.addChild(happyBgNode);
        happyBgNode.setPosition(-100, -14, 0);
        happyBgNode.addComponent(UITransform).setContentSize(160, 11);
        const happyBg = happyBgNode.addComponent(Graphics);
        happyBg.fillColor = new Color(230, 230, 230, 255);
        happyBg.roundRect(-80, -5.5, 160, 11, 5.5);
        happyBg.fill();

        const happyFillNode = new Node('HappyBarFill');
        bar.addChild(happyFillNode);
        happyFillNode.setPosition(-100, -14, 0);
        happyFillNode.addComponent(UITransform).setContentSize(160, 11);
        this.happinessBarFill = happyFillNode.addComponent(Graphics);

        const happyValNode = new Node('HappyVal');
        bar.addChild(happyValNode);
        happyValNode.setPosition(82, -14, 0);
        happyValNode.addComponent(UITransform).setContentSize(36, 18);
        this.happinessLabel = happyValNode.addComponent(Label);
        this.happinessLabel.string = '70';
        this.happinessLabel.fontSize = 13;
        this.happinessLabel.color = new Color(120, 120, 120, 255);
        this.happinessLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        const healthTitleNode = new Node('HealthTitle');
        bar.addChild(healthTitleNode);
        healthTitleNode.setPosition(-260, -40, 0);
        healthTitleNode.addComponent(UITransform).setContentSize(44, 20);
        const healthTitle = healthTitleNode.addComponent(Label);
        healthTitle.string = '健康';
        healthTitle.fontSize = 15;
        healthTitle.color = new Color(120, 120, 120, 255);
        healthTitle.horizontalAlign = Label.HorizontalAlign.LEFT;

        const healthBgNode = new Node('HealthBarBg');
        bar.addChild(healthBgNode);
        healthBgNode.setPosition(-100, -40, 0);
        healthBgNode.addComponent(UITransform).setContentSize(160, 11);
        const healthBg = healthBgNode.addComponent(Graphics);
        healthBg.fillColor = new Color(230, 230, 230, 255);
        healthBg.roundRect(-80, -5.5, 160, 11, 5.5);
        healthBg.fill();

        const healthFillNode = new Node('HealthBarFill');
        bar.addChild(healthFillNode);
        healthFillNode.setPosition(-100, -40, 0);
        healthFillNode.addComponent(UITransform).setContentSize(160, 11);
        this.healthBarFill = healthFillNode.addComponent(Graphics);

        const healthValNode = new Node('HealthVal');
        bar.addChild(healthValNode);
        healthValNode.setPosition(82, -40, 0);
        healthValNode.addComponent(UITransform).setContentSize(36, 18);
        this.healthLabel = healthValNode.addComponent(Label);
        this.healthLabel.string = '100';
        this.healthLabel.fontSize = 13;
        this.healthLabel.color = new Color(120, 120, 120, 255);
        this.healthLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    private drawExpBar(progress: number): void {
        if (!this.expBarFill) return;
        this.expBarFill.clear();
        const w = this.EXP_BAR_W * Math.max(progress, 0.02);
        const h = this.EXP_BAR_H;
        this.expBarFill.fillColor = new Color(255, 200, 50, 255);
        this.expBarFill.roundRect(-this.EXP_BAR_W / 2, -h / 2, w, h, h / 2);
        this.expBarFill.fill();
    }

    private drawHungerBar(progress: number): void {
        if (!this.hungerBarFill) return;
        this.hungerBarFill.clear();
        const w = 160 * Math.max(progress, 0.02);
        this.hungerBarFill.fillColor = new Color(255, 160, 60, 255);
        this.hungerBarFill.roundRect(-80, -5.5, w, 11, 5.5);
        this.hungerBarFill.fill();
    }

    private drawHappinessBar(progress: number): void {
        if (!this.happinessBarFill) return;
        this.happinessBarFill.clear();
        const w = 160 * Math.max(progress, 0.02);
        this.happinessBarFill.fillColor = new Color(255, 130, 180, 255);
        this.happinessBarFill.roundRect(-80, -5.5, w, 11, 5.5);
        this.happinessBarFill.fill();
    }

    private drawHealthBar(progress: number): void {
        if (!this.healthBarFill) return;
        this.healthBarFill.clear();
        const w = 160 * Math.max(progress, 0.02);
        if (progress > 0.6) {
            this.healthBarFill.fillColor = new Color(80, 200, 100, 255);
        } else if (progress > 0.3) {
            this.healthBarFill.fillColor = new Color(240, 180, 50, 255);
        } else {
            this.healthBarFill.fillColor = new Color(220, 70, 70, 255);
        }
        this.healthBarFill.roundRect(-80, -5.5, w, 11, 5.5);
        this.healthBarFill.fill();
    }

    private createActionBar(): void {
        const bar = new Node('ActionBar');
        this.rootNode.addChild(bar);
        bar.addComponent(UITransform).setContentSize(600, 180);
        bar.setPosition(200, -80, 0);

        const row1 = new Node('Row1');
        bar.addChild(row1);
        row1.addComponent(UITransform).setContentSize(580, 46);
        row1.setPosition(0, 55, 0);

        const row2 = new Node('Row2');
        bar.addChild(row2);
        row2.addComponent(UITransform).setContentSize(580, 46);
        row2.setPosition(0, 0, 0);

        this.makeButton(row1, '挑逗', new Color(255, 140, 170, 255), 85, 40, -235, 0, this.callbacks.onTease);
        this.makeButton(row1, '玩耍', new Color(120, 215, 165, 255), 85, 40, -140, 0, this.callbacks.onPlay);
        this.makeButton(row1, '睡觉', new Color(175, 160, 230, 255), 85, 40, -45, 0, this.callbacks.onSleep);
        this.makeButton(row1, '喂食', new Color(255, 185, 120, 255), 85, 40, 50, 0, () => { this.showFoodPanel(); });
        this.makeButton(row1, '商店', new Color(255, 210, 100, 255), 85, 40, 145, 0, () => { this.showShopPanel(); });

        this.makeButton(row2, '排行', new Color(140, 200, 220, 255), 85, 40, -235, 0, () => {
            this.callbacks.onSelectStudent(this.currentStudent?.studentId || '');
        });
        this.makeButton(row2, '勋章', new Color(230, 190, 100, 255), 85, 40, -140, 0, () => {
            this.callbacks.onSelectStudent(this.currentStudent?.studentId || '');
        });
        this.makeButton(row2, '医疗', new Color(130, 210, 160, 255), 85, 40, -45, 0, () => { this.showMedicalPanel(); });
        this.makeButton(row2, '教师', new Color(180, 160, 220, 255), 85, 40, 50, 0, () => { this.showTeacherPanel(this.students); });
        this.makeButton(row2, '设置', new Color(180, 180, 190, 255), 85, 40, 145, 0, () => { this.showPetSettings([]); });
    }

    private createStudentBar(): void {
        this.studentBarNode = new Node('StudentBar');
        this.rootNode.addChild(this.studentBarNode);
        const t = this.studentBarNode.addComponent(UITransform);
        t.setContentSize(340, 70);
        this.studentBarNode.setPosition(-200, -250, 0);

        const bg = this.studentBarNode.addComponent(Graphics);
        bg.fillColor = new Color(255, 255, 255, 205);
        bg.roundRect(-170, -35, 340, 70, 12);
        bg.fill();

        this.studentBarContent = new Node('StudentBarContent');
        this.studentBarNode.addChild(this.studentBarContent);
        this.studentBarContent.addComponent(UITransform).setContentSize(320, 56);
        this.studentBarContent.setPosition(0, 0, 0);
    }

    private createStudentListPanel(): void {
        this.studentListPanel = new Node('StudentListPanel');
        this.rootNode.addChild(this.studentListPanel);
        this.studentListPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.studentListPanel.addComponent(UIOpacity);
        this.studentListPanel.active = false;

        this.makeOverlay(this.studentListPanel);

        const panel = this.makePanel(this.studentListPanel, '学生列表', 600, 500, 0, () => { this.hideStudentList(); });

        const scrollViewNode = new Node('ScrollView');
        panel.addChild(scrollViewNode);
        scrollViewNode.setPosition(0, 10, 0);
        const svUt = scrollViewNode.addComponent(UITransform);
        svUt.setContentSize(560, 360);

        const scrollView = scrollViewNode.addComponent(ScrollView);
        scrollView.horizontal = false;
        scrollView.vertical = true;
        scrollView.brushMode = ScrollView.BrushMode.CONTENT_SIZE;

        const viewNode = new Node('View');
        scrollViewNode.addChild(viewNode);
        const viewUt = viewNode.addComponent(UITransform);
        viewUt.setContentSize(560, 360);

        this.studentListContent = new Node('StudentListContent');
        viewNode.addChild(this.studentListContent);
        const contentUt = this.studentListContent.addComponent(UITransform);
        contentUt.setContentSize(560, 360);
        this.studentListContent.setPosition(0, 180, 0);

        const layout = this.studentListContent.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.resizeChildren = true;

        scrollView.content = this.studentListContent;

        this.makeButton(panel, '添加学生', new Color(100, 180, 255, 255), 160, 44, 0, -195, () => {
            this.hideStudentList();
            this.showAddStudentPanel();
        });
    }

    private refreshStudentList(): void {
        if (!this.studentListContent) return;
        this.studentListContent.removeAllChildren();
        for (let i = 0; i < this.students.length; i++) {
            const s = this.students[i];
            this.createStudentCard(this.studentListContent, s);
        }
        if (this.students.length === 0) {
            const emptyNode = new Node('Empty');
            this.studentListContent.addChild(emptyNode);
            emptyNode.addComponent(UITransform).setContentSize(300, 30);
            const emptyLbl = emptyNode.addComponent(Label);
            emptyLbl.string = '暂无学生，请添加';
            emptyLbl.fontSize = 17;
            emptyLbl.color = new Color(160, 160, 170, 255);
            emptyLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        }

        const layout = this.studentListContent.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }

        const contentHeight = Math.max(360, this.students.length * 58);
        const ut = this.studentListContent.getComponent(UITransform);
        if (ut) {
            ut.setContentSize(560, contentHeight);
        }
    }

    private createStudentCard(parent: Node, student: StudentData): void {
        const card = new Node(student.studentId);
        parent.addChild(card);
        card.addComponent(UITransform).setContentSize(560, 52);
        const g = card.addComponent(Graphics);
        g.fillColor = new Color(248, 248, 252, 255);
        g.roundRect(-280, -26, 560, 52, 10);
        g.fill();
        g.strokeColor = new Color(220, 220, 225, 255);
        g.lineWidth = 1;
        g.roundRect(-280, -26, 560, 52, 10);
        g.stroke();

        const avatarNode = new Node('Avatar');
        card.addChild(avatarNode);
        avatarNode.setPosition(-240, 0, 0);
        avatarNode.addComponent(UITransform).setContentSize(36, 36);
        const ag = avatarNode.addComponent(Graphics);
        ag.fillColor = new Color(230, 235, 245, 255);
        ag.circle(0, 0, 18);
        ag.fill();
        const initNode = new Node('Init');
        avatarNode.addChild(initNode);
        initNode.addComponent(UITransform).setContentSize(36, 36);
        const initLbl = initNode.addComponent(Label);
        initLbl.string = student.name.charAt(0);
        initLbl.fontSize = 16;
        initLbl.color = new Color(80, 100, 140, 255);
        initLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        initLbl.verticalAlign = Label.VerticalAlign.CENTER;

        const nameNode = new Node('Name');
        card.addChild(nameNode);
        nameNode.setPosition(-110, 7, 0);
        nameNode.addComponent(UITransform).setContentSize(180, 20);
        const nameLbl = nameNode.addComponent(Label);
        nameLbl.string = student.name;
        nameLbl.fontSize = 16;
        nameLbl.color = new Color(50, 50, 60, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        const idNode = new Node('Id');
        card.addChild(idNode);
        idNode.setPosition(-110, -10, 0);
        idNode.addComponent(UITransform).setContentSize(180, 16);
        const idLbl = idNode.addComponent(Label);
        idLbl.string = student.studentId;
        idLbl.fontSize = 12;
        idLbl.color = new Color(140, 140, 150, 255);
        idLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        this.makeButton(card, '选择', new Color(100, 180, 255, 255), 72, 34, 140, 0, () => {
            this.callbacks.onSelectStudent(student.studentId);
            this.hideStudentList();
        });

        this.makeButton(card, '删除', new Color(255, 120, 100, 255), 72, 34, 228, 0, () => {
            this.callbacks.onDeleteStudent(student.studentId);
        });
    }

    private createFoodPanel(): void {
        this.foodPanel = new Node('FoodPanel');
        this.rootNode.addChild(this.foodPanel);
        this.foodPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.foodPanel.addComponent(UIOpacity);
        this.foodPanel.active = false;

        this.makeOverlay(this.foodPanel);

        const panel = this.makePanel(this.foodPanel, '食物背包', 600, 500, 0, () => { this.hideFoodPanel(); });

        const balanceNode = new Node('Balance');
        panel.addChild(balanceNode);
        balanceNode.setPosition(0, 210, 0);
        balanceNode.addComponent(UITransform).setContentSize(380, 26);
        this.foodBalanceLabel = balanceNode.addComponent(Label);
        this.foodBalanceLabel.string = '食物数量: 0';
        this.foodBalanceLabel.fontSize = 18;
        this.foodBalanceLabel.color = new Color(100, 100, 120, 255);
        this.foodBalanceLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

        this.foodListContent = new Node('FoodList');
        panel.addChild(this.foodListContent);
        this.foodListContent.addComponent(UITransform).setContentSize(560, 280);
        this.foodListContent.setPosition(0, 20, 0);

        this.makeButton(panel, '喂食', new Color(255, 185, 120, 255), 160, 44, -80, -210, () => {
            this.callbacks.onFeed();
            this.hideFoodPanel();
        });
        this.makeButton(panel, '关闭', new Color(180, 180, 190, 255), 100, 44, 110, -210, () => { this.hideFoodPanel(); });
    }

    refreshFoodList(): void {
        if (!this.foodListContent) return;
        this.foodListContent.removeAllChildren();
        const inv: FoodItemData[] = [];
        const foodCount = inv.length;
        if (this.foodBalanceLabel) {
            this.foodBalanceLabel.string = `食物数量: ${foodCount}`;
            this.foodBalanceLabel.color = foodCount > 0
                ? new Color(80, 180, 80, 255)
                : new Color(180, 80, 80, 255);
        }
        const cols = 4;
        const cardW = 125;
        const cardH = 70;
        const gap = 10;
        const startX = -(cols * (cardW + gap) - gap) / 2 + cardW / 2;
        const startY = 115;
        for (let i = 0; i < inv.length; i++) {
            const food = inv[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY - row * (cardH + gap);
            this.createFoodCard(this.foodListContent, food, x, y, cardW, cardH);
        }
        if (inv.length === 0) {
            const emptyNode = new Node('Empty');
            this.foodListContent.addChild(emptyNode);
            emptyNode.addComponent(UITransform).setContentSize(300, 30);
            const emptyLbl = emptyNode.addComponent(Label);
            emptyLbl.string = '背包空空如也，快去扫码吧！';
            emptyLbl.fontSize = 16;
            emptyLbl.color = new Color(160, 160, 170, 255);
            emptyLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        }
    }

    private createFoodCard(parent: Node, food: FoodItemData, x: number, y: number, w: number, h: number): void {
        const card = new Node(food.id);
        parent.addChild(card);
        card.setPosition(x, y, 0);
        card.addComponent(UITransform).setContentSize(w, h);
        const g = card.addComponent(Graphics);
        g.fillColor = new Color(240, 248, 255, 255);
        g.roundRect(-w / 2, -h / 2, w, h, 10);
        g.fill();
        g.strokeColor = new Color(180, 200, 220, 255);
        g.lineWidth = 1.5;
        g.roundRect(-w / 2, -h / 2, w, h, 10);
        g.stroke();

        g.fillColor = new Color(100, 180, 100, 255);
        g.circle(-w / 2 + 16, h / 2 - 16, 7);
        g.fill();

        const nameNode = new Node('Name');
        card.addChild(nameNode);
        nameNode.setPosition(0, 8, 0);
        nameNode.addComponent(UITransform).setContentSize(w - 8, 20);
        const nameLbl = nameNode.addComponent(Label);
        nameLbl.string = food.name;
        nameLbl.fontSize = 14;
        nameLbl.color = new Color(50, 50, 60, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const attrNode = new Node('Attr');
        card.addChild(attrNode);
        attrNode.setPosition(0, -12, 0);
        attrNode.addComponent(UITransform).setContentSize(w - 8, 16);
        const attrLbl = attrNode.addComponent(Label);
        attrLbl.string = `经验 +${food.expValue}`;
        attrLbl.fontSize = 12;
        attrLbl.color = new Color(100, 160, 100, 255);
        attrLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
    }

    private createShopPanel(): void {
        this.shopPanel = new Node('ShopPanel');
        this.rootNode.addChild(this.shopPanel);
        this.shopPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.shopPanel.addComponent(UIOpacity);
        this.shopPanel.active = false;

        this.makeOverlay(this.shopPanel);

        const panel = this.makePanel(this.shopPanel, '宠物商店', 620, 500, 0, () => { this.hideShopPanel(); });

        const tabY = 210;
        const categories = [
            { label: '食物', category: 'food', color: new Color(255, 185, 120, 255) },
            { label: '医疗', category: 'medical', color: new Color(130, 210, 160, 255) },
            { label: '进化', category: 'evolution', color: new Color(175, 160, 230, 255) },
        ];
        this.shopCategoryBtns = [];
        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            const x = -180 + i * 180;
            const btnNode = this.makeButton(panel, cat.label, cat.color, 130, 38, x, tabY, () => {
                this.refreshShopList(cat.category);
            });
            this.shopCategoryBtns.push({ node: btnNode, category: cat.category });
        }

        this.shopListContent = new Node('ShopList');
        panel.addChild(this.shopListContent);
        this.shopListContent.addComponent(UITransform).setContentSize(580, 320);
        this.shopListContent.setPosition(0, -10, 0);
    }

    private updateShopTabs(): void {
        for (const tab of this.shopCategoryBtns) {
            const g = tab.node.getComponent(Graphics);
            if (!g) continue;
            g.clear();
            const w = 130;
            const h = 38;
            if (tab.category === this.shopCategory) {
                g.fillColor = new Color(100, 180, 255, 255);
            } else {
                g.fillColor = new Color(210, 210, 215, 255);
            }
            g.roundRect(-w / 2, -h / 2, w, h, h / 3);
            g.fill();
        }
    }

    private createShopItemCard(parent: Node, item: ShopItemData, y: number): void {
        const card = new Node(item.id);
        parent.addChild(card);
        card.setPosition(0, y, 0);
        card.addComponent(UITransform).setContentSize(560, 62);
        const g = card.addComponent(Graphics);
        g.fillColor = new Color(248, 248, 252, 255);
        g.roundRect(-280, -31, 560, 62, 10);
        g.fill();
        g.strokeColor = new Color(220, 220, 225, 255);
        g.lineWidth = 1;
        g.roundRect(-280, -31, 560, 62, 10);
        g.stroke();

        const nameNode = new Node('Name');
        card.addChild(nameNode);
        nameNode.setPosition(-95, 13, 0);
        nameNode.addComponent(UITransform).setContentSize(280, 20);
        const nameLbl = nameNode.addComponent(Label);
        nameLbl.string = item.name;
        nameLbl.fontSize = 16;
        nameLbl.color = new Color(50, 50, 60, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        const descNode = new Node('Desc');
        card.addChild(descNode);
        descNode.setPosition(-95, -8, 0);
        descNode.addComponent(UITransform).setContentSize(280, 16);
        const descLbl = descNode.addComponent(Label);
        descLbl.string = item.description;
        descLbl.fontSize = 13;
        descLbl.color = new Color(140, 140, 150, 255);
        descLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        const costNode = new Node('Cost');
        card.addChild(costNode);
        costNode.setPosition(135, 13, 0);
        costNode.addComponent(UITransform).setContentSize(90, 20);
        const costLbl = costNode.addComponent(Label);
        costLbl.string = `💎${item.diamondCost}`;
        costLbl.fontSize = 16;
        costLbl.color = new Color(80, 160, 255, 255);
        costLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        this.makeButton(card, '购买', new Color(255, 185, 120, 255), 74, 32, 210, -4, () => {
            this.callbacks.onShopPurchase(item.id);
        });
    }

    private createRankPanel(): void {
        this.rankPanel = new Node('RankPanel');
        this.rootNode.addChild(this.rankPanel);
        this.rankPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.rankPanel.addComponent(UIOpacity);
        this.rankPanel.active = false;

        this.makeOverlay(this.rankPanel);

        const panel = this.makePanel(this.rankPanel, '成长排行榜', 600, 500, 0, () => { this.hideRankPanel(); });

        this.rankListContent = new Node('RankList');
        panel.addChild(this.rankListContent);
        this.rankListContent.addComponent(UITransform).setContentSize(560, 380);
        this.rankListContent.setPosition(0, -10, 0);
    }

    private createRankEntryCard(parent: Node, name: string, totalExp: number, stage: GrowthStage, rank: number, y: number, stageNames: string[]): void {
        const card = new Node(`Rank${rank}`);
        parent.addChild(card);
        card.setPosition(0, y, 0);
        card.addComponent(UITransform).setContentSize(560, 48);
        const g = card.addComponent(Graphics);

        if (rank <= 3) {
            const colors = [
                new Color(255, 240, 200, 255),
                new Color(240, 240, 245, 255),
                new Color(240, 225, 210, 255),
            ];
            g.fillColor = colors[rank - 1];
        } else {
            g.fillColor = new Color(248, 248, 252, 255);
        }
        g.roundRect(-280, -24, 560, 48, 8);
        g.fill();
        g.strokeColor = new Color(220, 220, 225, 255);
        g.lineWidth = 1;
        g.roundRect(-280, -24, 560, 48, 8);
        g.stroke();

        const rankNode = new Node('RankNum');
        card.addChild(rankNode);
        rankNode.setPosition(-238, 0, 0);
        rankNode.addComponent(UITransform).setContentSize(36, 26);
        const rankLbl = rankNode.addComponent(Label);
        rankLbl.string = `${rank}`;
        rankLbl.fontSize = 19;
        if (rank === 1) rankLbl.color = new Color(255, 200, 50, 255);
        else if (rank === 2) rankLbl.color = new Color(180, 180, 190, 255);
        else if (rank === 3) rankLbl.color = new Color(200, 150, 100, 255);
        else rankLbl.color = new Color(120, 120, 130, 255);
        rankLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const nameNode = new Node('Name');
        card.addChild(nameNode);
        nameNode.setPosition(-125, 7, 0);
        nameNode.addComponent(UITransform).setContentSize(160, 20);
        const nameLbl = nameNode.addComponent(Label);
        nameLbl.string = name;
        nameLbl.fontSize = 15;
        nameLbl.color = new Color(50, 50, 60, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        const stageNode = new Node('Stage');
        card.addChild(stageNode);
        stageNode.setPosition(-125, -9, 0);
        stageNode.addComponent(UITransform).setContentSize(160, 16);
        const stageLbl = stageNode.addComponent(Label);
        stageLbl.string = stageNames[stage] || '蛋蛋';
        stageLbl.fontSize = 12;
        stageLbl.color = new Color(140, 140, 150, 255);
        stageLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        const expBgNode = new Node('ExpBg');
        card.addChild(expBgNode);
        expBgNode.setPosition(100, 0, 0);
        expBgNode.addComponent(UITransform).setContentSize(110, 9);
        const expBg = expBgNode.addComponent(Graphics);
        expBg.fillColor = new Color(230, 230, 230, 255);
        expBg.roundRect(-55, -4.5, 110, 9, 4.5);
        expBg.fill();

        const expFillNode = new Node('ExpFill');
        card.addChild(expFillNode);
        expFillNode.setPosition(100, 0, 0);
        expFillNode.addComponent(UITransform).setContentSize(110, 9);
        const expFill = expFillNode.addComponent(Graphics);
        const expProgress = Math.min(totalExp / 10000, 1);
        const expW = 110 * Math.max(expProgress, 0.02);
        expFill.fillColor = new Color(255, 200, 50, 255);
        expFill.roundRect(-55, -4.5, expW, 9, 4.5);
        expFill.fill();

        const expValNode = new Node('ExpVal');
        card.addChild(expValNode);
        expValNode.setPosition(195, 0, 0);
        expValNode.addComponent(UITransform).setContentSize(70, 16);
        const expValLbl = expValNode.addComponent(Label);
        expValLbl.string = `${totalExp}`;
        expValLbl.fontSize = 12;
        expValLbl.color = new Color(140, 140, 150, 255);
        expValLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    private createMedalPanel(): void {
        this.medalPanel = new Node('MedalPanel');
        this.rootNode.addChild(this.medalPanel);
        this.medalPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.medalPanel.addComponent(UIOpacity);
        this.medalPanel.active = false;

        this.makeOverlay(this.medalPanel);

        const panel = this.makePanel(this.medalPanel, '我的勋章', 600, 500, 0, () => { this.hideMedalPanel(); });

        this.medalListContent = new Node('MedalList');
        panel.addChild(this.medalListContent);
        this.medalListContent.addComponent(UITransform).setContentSize(560, 380);
        this.medalListContent.setPosition(0, -10, 0);
    }

    private createMedalCard(parent: Node, medal: MedalData, earned: boolean, x: number, y: number, w: number, h: number): void {
        const card = new Node(medal.id);
        parent.addChild(card);
        card.setPosition(x, y, 0);
        card.addComponent(UITransform).setContentSize(w, h);
        const g = card.addComponent(Graphics);
        if (earned) {
            g.fillColor = new Color(255, 248, 230, 255);
            g.roundRect(-w / 2, -h / 2, w, h, 10);
            g.fill();
            g.strokeColor = new Color(230, 190, 80, 255);
            g.lineWidth = 2;
            g.roundRect(-w / 2, -h / 2, w, h, 10);
            g.stroke();
        } else {
            g.fillColor = new Color(235, 235, 238, 255);
            g.roundRect(-w / 2, -h / 2, w, h, 10);
            g.fill();
            g.strokeColor = new Color(200, 200, 205, 255);
            g.lineWidth = 1;
            g.roundRect(-w / 2, -h / 2, w, h, 10);
            g.stroke();
        }

        if (earned) {
            g.fillColor = new Color(255, 200, 50, 255);
            g.circle(-w / 2 + 20, h / 2 - 20, 9);
            g.fill();
        }

        const nameNode = new Node('Name');
        card.addChild(nameNode);
        nameNode.setPosition(0, 22, 0);
        nameNode.addComponent(UITransform).setContentSize(w - 16, 20);
        const nameLbl = nameNode.addComponent(Label);
        nameLbl.string = medal.name;
        nameLbl.fontSize = 15;
        nameLbl.color = earned ? new Color(50, 50, 60, 255) : new Color(160, 160, 165, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const descNode = new Node('Desc');
        card.addChild(descNode);
        descNode.setPosition(0, 0, 0);
        descNode.addComponent(UITransform).setContentSize(w - 16, 16);
        const descLbl = descNode.addComponent(Label);
        descLbl.string = medal.description;
        descLbl.fontSize = 12;
        descLbl.color = earned ? new Color(120, 120, 130, 255) : new Color(170, 170, 175, 255);
        descLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const bonusNode = new Node('Bonus');
        card.addChild(bonusNode);
        bonusNode.setPosition(0, -20, 0);
        bonusNode.addComponent(UITransform).setContentSize(w - 16, 16);
        const bonusLbl = bonusNode.addComponent(Label);
        let bonusText = `经验+${medal.bonusExp}`;
        if (medal.bonusAttribute) bonusText += ` 属性+${medal.bonusAttribute}`;
        bonusLbl.string = bonusText;
        bonusLbl.fontSize = 11;
        bonusLbl.color = earned ? new Color(180, 150, 50, 255) : new Color(170, 170, 175, 255);
        bonusLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
    }

    private createMedicalPanel(): void {
        this.medicalPanel = new Node('MedicalPanel');
        this.rootNode.addChild(this.medicalPanel);
        this.medicalPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.medicalPanel.addComponent(UIOpacity);
        this.medicalPanel.active = false;

        this.makeOverlay(this.medicalPanel);

        const panel = this.makePanel(this.medicalPanel, '宠物医院', 500, 450, 0, () => { this.hideMedicalPanel(); });

        const healthNode = new Node('HealthVal');
        panel.addChild(healthNode);
        healthNode.setPosition(0, 155, 0);
        healthNode.addComponent(UITransform).setContentSize(280, 28);
        this.medicalHealthLabel = healthNode.addComponent(Label);
        this.medicalHealthLabel.string = '健康值: 100/100';
        this.medicalHealthLabel.fontSize = 22;
        this.medicalHealthLabel.color = new Color(50, 50, 60, 255);
        this.medicalHealthLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

        const statusNode = new Node('Status');
        panel.addChild(statusNode);
        statusNode.setPosition(0, 118, 0);
        statusNode.addComponent(UITransform).setContentSize(180, 24);
        this.medicalStatusLabel = statusNode.addComponent(Label);
        this.medicalStatusLabel.string = '状态: 健康';
        this.medicalStatusLabel.fontSize = 18;
        this.medicalStatusLabel.color = new Color(50, 180, 80, 255);
        this.medicalStatusLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

        const healthBarBgNode = new Node('HealthBarBg');
        panel.addChild(healthBarBgNode);
        healthBarBgNode.setPosition(0, 78, 0);
        healthBarBgNode.addComponent(UITransform).setContentSize(280, 14);
        const hbg = healthBarBgNode.addComponent(Graphics);
        hbg.fillColor = new Color(230, 230, 230, 255);
        hbg.roundRect(-140, -7, 280, 14, 7);
        hbg.fill();

        const healthBarFillNode = new Node('HealthBarFill');
        panel.addChild(healthBarFillNode);
        healthBarFillNode.setPosition(0, 78, 0);
        healthBarFillNode.addComponent(UITransform).setContentSize(280, 14);
        const hfill = healthBarFillNode.addComponent(Graphics);
        hfill.fillColor = new Color(80, 200, 100, 255);
        hfill.roundRect(-140, -7, 280, 14, 7);
        hfill.fill();

        this.makeButton(panel, '治疗 (10💎→+30❤)', new Color(80, 200, 120, 255), 220, 46, 0, 20, () => {
            this.callbacks.onHeal(30);
            this.hideMedicalPanel();
        });

        this.reviveBtn = this.makeButton(panel, '复活 (20💎)', new Color(255, 100, 100, 255), 180, 46, 0, -38, () => {
            this.callbacks.onRevive();
            this.hideMedicalPanel();
        });
        this.reviveBtn.active = false;
    }

    private teacherPwdArea: Node | null = null;
    private teacherVerifyBtn: Node | null = null;

    private createTeacherPanel(): void {
        this.teacherPanel = new Node('TeacherPanel');
        this.rootNode.addChild(this.teacherPanel);
        this.teacherPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.teacherPanel.addComponent(UIOpacity);
        this.teacherPanel.active = false;

        this.makeOverlay(this.teacherPanel);

        const panel = this.makePanel(this.teacherPanel, '教师管理', 640, 500, 0, () => { this.hideTeacherPanel(); });

        this.teacherPwdArea = new Node('PwdArea');
        panel.addChild(this.teacherPwdArea);
        this.teacherPwdArea.addComponent(UITransform).setContentSize(600, 60);

        const pwdLabelNode = new Node('PwdLabel');
        this.teacherPwdArea.addChild(pwdLabelNode);
        pwdLabelNode.setPosition(-220, 18, 0);
        pwdLabelNode.addComponent(UITransform).setContentSize(90, 30);
        const pwdLbl = pwdLabelNode.addComponent(Label);
        pwdLbl.string = '密码:';
        pwdLbl.fontSize = 18;
        pwdLbl.color = new Color(50, 50, 65, 255);
        pwdLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        const pwdEditNode = new Node('PasswordEdit');
        this.teacherPwdArea.addChild(pwdEditNode);
        pwdEditNode.setPosition(-20, 0, 0);
        this.teacherPasswordEdit = this.makeEditBox(this.teacherPwdArea, 240, 36, -20, 0, '请输入教师密码', EditBox.InputMode.ANY, EditBox.InputFlag.PASSWORD, 16);

        this.teacherVerifyBtn = this.makeButton(this.teacherPwdArea, '验证', new Color(80, 160, 245, 255), 86, 36, 200, 0, () => {
            if (this.teacherPasswordEdit && this.teacherPasswordEdit.string === '123456') {
                this.teacherVerified = true;
                this.hideTeacherPwdArea();
                if (this.teacherContentNode) this.teacherContentNode.active = true;
                this.showToast('验证成功');
                this.refreshTeacherTab();
            } else {
                this.showToast('密码错误');
            }
        });

        this.teacherContentNode = new Node('TeacherContent');
        panel.addChild(this.teacherContentNode);
        this.teacherContentNode.addComponent(UITransform).setContentSize(600, 420);
        this.teacherContentNode.setPosition(0, -40, 0);
        this.teacherContentNode.active = false;

        const tabY = 180;
        const tabs = [
            { label: '钻石管理', tab: 'diamond', color: new Color(75, 150, 250, 255) },
            { label: '勋章管理', tab: 'medal', color: new Color(225, 185, 95, 255) },
            { label: '批量操作', tab: 'batch', color: new Color(170, 155, 225, 255) },
        ];
        for (let i = 0; i < tabs.length; i++) {
            const tb = tabs[i];
            const x = -210 + i * 210;
            this.makeButton(this.teacherContentNode, tb.label, tb.color, 140, 34, x, tabY, () => {
                this.teacherTab = tb.tab;
                this.refreshTeacherTab();
            });
        }

        this.teacherTabContent = new Node('TabContent');
        this.teacherContentNode.addChild(this.teacherTabContent);
        this.teacherTabContent.addComponent(UITransform).setContentSize(580, 280);
        this.teacherTabContent.setPosition(0, -10, 0);
    }

    private refreshTeacherTab(): void {
        if (!this.teacherTabContent) return;
        this.teacherTabContent.removeAllChildren();

        if (this.teacherTab === 'diamond') {
            this.createTeacherDiamondTab();
        } else if (this.teacherTab === 'medal') {
            this.createTeacherMedalTab();
        } else if (this.teacherTab === 'batch') {
            this.createTeacherBatchTab();
        }
    }

    private createTeacherDiamondTab(): void {
        const content = this.teacherTabContent!;

        const addLabelNode = new Node('AddLabel');
        content.addChild(addLabelNode);
        addLabelNode.setPosition(-240, 115, 0);
        addLabelNode.addComponent(UITransform).setContentSize(100, 24);
        const addLbl = addLabelNode.addComponent(Label);
        addLbl.string = '发放钻石:';
        addLbl.fontSize = 16;
        addLbl.color = new Color(50, 50, 65, 255);
        addLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        this.teacherAddDiamondEdit = this.makeEditBox(content, 130, 32, -40, 115, '输入数量', EditBox.InputMode.NUMERIC);

        this.makeButton(content, '发放', new Color(75, 195, 115, 255), 70, 32, 100, 115, () => {
            const amount = parseInt(this.teacherAddDiamondEdit?.string || '0') || 0;
            if (amount > 0) {
                this.callbacks.onTeacherAddDiamond(amount);
                this.showToast(`发放${amount}钻石`);
            }
        });

        const redLabelNode = new Node('RedLabel');
        content.addChild(redLabelNode);
        redLabelNode.setPosition(-240, 62, 0);
        redLabelNode.addComponent(UITransform).setContentSize(100, 24);
        const redLbl = redLabelNode.addComponent(Label);
        redLbl.string = '扣减钻石:';
        redLbl.fontSize = 16;
        redLbl.color = new Color(50, 50, 65, 255);
        redLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        this.teacherReduceDiamondEdit = this.makeEditBox(content, 130, 32, -40, 62, '输入数量', EditBox.InputMode.NUMERIC);

        this.makeButton(content, '扣减', new Color(250, 115, 95, 255), 70, 32, 100, 62, () => {
            const amount = parseInt(this.teacherReduceDiamondEdit?.string || '0') || 0;
            if (amount > 0) {
                this.callbacks.onTeacherReduceDiamond(amount);
                this.showToast(`扣减${amount}钻石`);
            }
        });

        const transferLabelNode = new Node('TransferLabel');
        content.addChild(transferLabelNode);
        transferLabelNode.setPosition(0, 10, 0);
        transferLabelNode.addComponent(UITransform).setContentSize(160, 22);
        const transferLbl = transferLabelNode.addComponent(Label);
        transferLbl.string = '钻石转送';
        transferLbl.fontSize = 16;
        transferLbl.color = new Color(80, 85, 100, 200);
        transferLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const fromLabelNode = new Node('FromLabel');
        content.addChild(fromLabelNode);
        fromLabelNode.setPosition(-240, -30, 0);
        fromLabelNode.addComponent(UITransform).setContentSize(110, 20);
        const fromLbl = fromLabelNode.addComponent(Label);
        fromLbl.string = '来源学生ID:';
        fromLbl.fontSize = 14;
        fromLbl.color = new Color(50, 50, 65, 255);
        fromLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        this.teacherFromStudentEdit = this.makeEditBox(content, 140, 32, -40, -30, '学生ID');

        const toLabelNode = new Node('ToLabel');
        content.addChild(toLabelNode);
        toLabelNode.setPosition(-240, -72, 0);
        toLabelNode.addComponent(UITransform).setContentSize(110, 20);
        const toLbl = toLabelNode.addComponent(Label);
        toLbl.string = '目标学生ID:';
        toLbl.fontSize = 14;
        toLbl.color = new Color(50, 50, 65, 255);
        toLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        this.teacherToStudentEdit = this.makeEditBox(content, 140, 32, -40, -72, '学生ID');

        const amtLabelNode = new Node('AmtLabel');
        content.addChild(amtLabelNode);
        amtLabelNode.setPosition(-240, -112, 0);
        amtLabelNode.addComponent(UITransform).setContentSize(96, 20);
        const amtLbl = amtLabelNode.addComponent(Label);
        amtLbl.string = '转送数量:';
        amtLbl.fontSize = 14;
        amtLbl.color = new Color(50, 50, 65, 255);
        amtLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        this.teacherTransferAmountEdit = this.makeEditBox(content, 140, 32, -40, -112, '数量', EditBox.InputMode.NUMERIC);

        this.makeButton(content, '转送', new Color(100, 180, 255, 255), 88, 36, 80, -112, () => {
            const fromId = this.teacherFromStudentEdit?.string || '';
            const toId = this.teacherToStudentEdit?.string || '';
            const amount = parseInt(this.teacherTransferAmountEdit?.string || '0') || 0;
            if (amount > 0 && fromId && toId) {
                this.callbacks.onTeacherTransferDiamond(fromId, toId, amount);
                this.showToast(`转送${amount}钻石`);
            } else {
                this.showToast('请填写完整信息');
            }
        });
    }

    private createTeacherMedalTab(): void {
        const content = this.teacherTabContent!;

        const medalLabelNode = new Node('MedalLabel');
        content.addChild(medalLabelNode);
        medalLabelNode.setPosition(0, 108, 0);
        medalLabelNode.addComponent(UITransform).setContentSize(180, 22);
        const medalLbl = medalLabelNode.addComponent(Label);
        medalLbl.string = '选择勋章发放:';
        medalLbl.fontSize = 16;
        medalLbl.color = new Color(60, 60, 80, 255);
        medalLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const medalBtnContainer = new Node('MedalBtns');
        content.addChild(medalBtnContainer);
        medalBtnContainer.addComponent(UITransform).setContentSize(520, 160);
        medalBtnContainer.setPosition(0, 40, 0);

        for (let i = 0; i < MEDAL_DEFINITIONS.length; i++) {
            const m = MEDAL_DEFINITIONS[i];
            const mx = -200 + (i % 3) * 200;
            const my = -Math.floor(i / 3) * 42;
            this.makeButton(medalBtnContainer, m.name, new Color(230, 190, 100, 255), 150, 36, mx, my, () => {
                this.teacherSelectedMedalId = m.id;
                this.callbacks.onTeacherAddMedal(m.id);
                this.showToast(`发放勋章: ${m.name}`);
            });
        }

        const studentHintNode = new Node('StudentHint');
        content.addChild(studentHintNode);
        studentHintNode.setPosition(0, -65, 0);
        studentHintNode.addComponent(UITransform).setContentSize(360, 22);
        const hintLbl = studentHintNode.addComponent(Label);
        hintLbl.string = '勋章将发放给当前选中的学生';
        hintLbl.fontSize = 14;
        hintLbl.color = new Color(140, 140, 150, 255);
        hintLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
    }

    private createTeacherBatchTab(): void {
        const content = this.teacherTabContent!;

        const batchLabelNode = new Node('BatchLabel');
        content.addChild(batchLabelNode);
        batchLabelNode.setPosition(0, 108, 0);
        batchLabelNode.addComponent(UITransform).setContentSize(180, 22);
        const batchLbl = batchLabelNode.addComponent(Label);
        batchLbl.string = '批量操作 - 选择学生:';
        batchLbl.fontSize = 16;
        batchLbl.color = new Color(60, 60, 80, 255);
        batchLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        this.makeButton(content, '全选', new Color(100, 180, 255, 255), 72, 33, -200, 68, () => {
            for (const s of this.teacherStudents) {
                this.teacherBatchStudentChecks.set(s.studentId, true);
            }
            this.refreshTeacherTab();
        });

        this.makeButton(content, '全不选', new Color(180, 180, 190, 255), 76, 33, -110, 68, () => {
            this.teacherBatchStudentChecks.clear();
            this.refreshTeacherTab();
        });

        const checkContainer = new Node('CheckContainer');
        content.addChild(checkContainer);
        checkContainer.addComponent(UITransform).setContentSize(560, 120);
        checkContainer.setPosition(0, 8, 0);

        for (let i = 0; i < this.teacherStudents.length; i++) {
            const s = this.teacherStudents[i];
            const checked = this.teacherBatchStudentChecks.get(s.studentId) || false;
            const x = -200 + (i % 3) * 200;
            const y = -Math.floor(i / 3) * 38;
            this.makeButton(checkContainer, `${checked ? '☑' : '☐'} ${s.name}`, checked ? new Color(100, 180, 255, 255) : new Color(210, 210, 215, 255), 158, 34, x, y, () => {
                const current = this.teacherBatchStudentChecks.get(s.studentId) || false;
                this.teacherBatchStudentChecks.set(s.studentId, !current);
                this.refreshTeacherTab();
            });
        }

        const amtLabelNode = new Node('BatchAmtLabel');
        content.addChild(amtLabelNode);
        amtLabelNode.setPosition(-240, -68, 0);
        amtLabelNode.addComponent(UITransform).setContentSize(96, 20);
        const amtLbl = amtLabelNode.addComponent(Label);
        amtLbl.string = '钻石数量:';
        amtLbl.fontSize = 14;
        amtLbl.color = new Color(50, 50, 65, 255);
        amtLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        this.teacherBatchAmountEdit = this.makeEditBox(content, 140, 32, -40, -68, '数量', EditBox.InputMode.NUMERIC);

        this.makeButton(content, '批量发放钻石', new Color(80, 200, 120, 255), 160, 36, 80, -68, () => {
            const amount = parseInt(this.teacherBatchAmountEdit?.string || '0') || 0;
            const selectedIds = this.getSelectedBatchStudentIds();
            if (amount > 0 && selectedIds.length > 0) {
                this.callbacks.onBatchDiamond(selectedIds, amount, 'add');
                this.showToast(`批量发放${amount}钻石给${selectedIds.length}名学生`);
            } else {
                this.showToast('请选择学生并输入数量');
            }
        });

        const batchMedalLabelNode = new Node('BatchMedalLabel');
        content.addChild(batchMedalLabelNode);
        batchMedalLabelNode.setPosition(0, -118, 0);
        batchMedalLabelNode.addComponent(UITransform).setContentSize(180, 22);
        const bmLbl = batchMedalLabelNode.addComponent(Label);
        bmLbl.string = '批量发放勋章:';
        bmLbl.fontSize = 16;
        bmLbl.color = new Color(60, 60, 80, 255);
        bmLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const batchMedalContainer = new Node('BatchMedalBtns');
        content.addChild(batchMedalContainer);
        batchMedalContainer.addComponent(UITransform).setContentSize(520, 80);
        batchMedalContainer.setPosition(0, -168, 0);

        for (let i = 0; i < MEDAL_DEFINITIONS.length; i++) {
            const m = MEDAL_DEFINITIONS[i];
            const mx = -200 + (i % 3) * 200;
            const my = -Math.floor(i / 3) * 36;
            this.makeButton(batchMedalContainer, m.name, new Color(230, 190, 100, 255), 150, 32, mx, my, () => {
                const selectedIds = this.getSelectedBatchStudentIds();
                if (selectedIds.length > 0) {
                    this.callbacks.onBatchMedal(selectedIds, m.id);
                    this.showToast(`批量发放${m.name}给${selectedIds.length}名学生`);
                } else {
                    this.showToast('请先选择学生');
                }
            });
        }
    }

    private getSelectedBatchStudentIds(): string[] {
        const ids: string[] = [];
        this.teacherBatchStudentChecks.forEach((checked, id) => {
            if (checked) ids.push(id);
        });
        return ids;
    }

    private createPetSettingsPanel(): void {
        this.petSettingsPanel = new Node('PetSettingsPanel');
        this.rootNode.addChild(this.petSettingsPanel);
        this.petSettingsPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.petSettingsPanel.addComponent(UIOpacity);
        this.petSettingsPanel.active = false;

        this.makeOverlay(this.petSettingsPanel);

        const panel = this.makePanel(this.petSettingsPanel, '宠物设置', 600, 500, 0, () => { this.hidePetSettings(); });

        const nameLabelNode = new Node('NameLabel');
        panel.addChild(nameLabelNode);
        nameLabelNode.setPosition(-170, 185, 0);
        nameLabelNode.addComponent(UITransform).setContentSize(96, 22);
        const nameLbl = nameLabelNode.addComponent(Label);
        nameLbl.string = '宠物命名:';
        nameLbl.fontSize = 17;
        nameLbl.color = new Color(60, 60, 80, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        const nameEditNode = new Node('NameEdit');
        panel.addChild(nameEditNode);
        nameEditNode.setPosition(20, 185, 0);
        this.petNameEdit = this.makeEditBox(panel, 210, 36, 20, 185, '输入宠物名', EditBox.InputMode.ANY, EditBox.InputFlag.DEFAULT, 17);

        this.makeButton(panel, '确认', new Color(100, 180, 255, 255), 74, 36, 175, 185, () => {
            const name = this.petNameEdit?.string || '';
            if (name) {
                this.callbacks.onRenamePet(name);
                this.showToast(`宠物命名为: ${name}`);
            }
        });

        const uploadLabelNode = new Node('UploadLabel');
        panel.addChild(uploadLabelNode);
        uploadLabelNode.setPosition(0, 128, 0);
        uploadLabelNode.addComponent(UITransform).setContentSize(180, 22);
        const uploadLbl = uploadLabelNode.addComponent(Label);
        uploadLbl.string = '上传宠物图片:';
        uploadLbl.fontSize = 17;
        uploadLbl.color = new Color(60, 60, 80, 255);
        uploadLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        const uploadAreaNode = new Node('UploadArea');
        panel.addChild(uploadAreaNode);
        uploadAreaNode.setPosition(0, 65, 0);
        uploadAreaNode.addComponent(UITransform).setContentSize(180, 100);
        const uBg = uploadAreaNode.addComponent(Graphics);
        uBg.fillColor = new Color(245, 245, 250, 255);
        uBg.roundRect(-90, -50, 180, 100, 12);
        uBg.fill();
        uBg.strokeColor = new Color(200, 200, 210, 255);
        uBg.lineWidth = 2;
        uBg.roundRect(-90, -50, 180, 100, 12);
        uBg.stroke();

        const uploadHintNode = new Node('UploadHint');
        uploadAreaNode.addChild(uploadHintNode);
        uploadHintNode.addComponent(UITransform).setContentSize(160, 26);
        const uploadHintLbl = uploadHintNode.addComponent(Label);
        uploadHintLbl.string = '点击上传图片';
        uploadHintLbl.fontSize = 15;
        uploadHintLbl.color = new Color(160, 160, 170, 255);
        uploadHintLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        uploadHintLbl.verticalAlign = Label.VerticalAlign.CENTER;

        const uploadBtn = uploadAreaNode.addComponent(Button);
        uploadBtn.transition = Button.Transition.SCALE;
        uploadBtn.zoomScale = 0.95;
        uploadBtn.duration = 0.08;
        uploadAreaNode.on(Node.EventType.TOUCH_END, (ev: any) => {
            ev.propagationStopped = true;
            this.triggerImageUpload();
        }, this);

        const pathLabelNode = new Node('PathLabel');
        panel.addChild(pathLabelNode);
        pathLabelNode.setPosition(0, -5, 0);
        pathLabelNode.addComponent(UITransform).setContentSize(180, 22);
        const pathLbl = pathLabelNode.addComponent(Label);
        pathLbl.string = '升级路线:';
        pathLbl.fontSize = 17;
        pathLbl.color = new Color(60, 60, 80, 255);
        pathLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        this.upgradePathDropdown = new Node('PathDropdown');
        panel.addChild(this.upgradePathDropdown);
        this.upgradePathDropdown.setPosition(0, -48, 0);
        this.upgradePathDropdown.addComponent(UITransform).setContentSize(280, 36);
        const dBg = this.upgradePathDropdown.addComponent(Graphics);
        dBg.fillColor = new Color(235, 238, 242, 255);
        dBg.roundRect(-140, -18, 280, 36, 8);
        dBg.fill();
        dBg.strokeColor = new Color(170, 175, 185, 200);
        dBg.lineWidth = 1;
        dBg.roundRect(-140, -18, 280, 36, 8);
        dBg.stroke();

        const pathLblNode = new Node('PathLabel');
        this.upgradePathDropdown.addChild(pathLblNode);
        pathLblNode.addComponent(UITransform).setContentSize(240, 32);
        this.upgradePathLabel = pathLblNode.addComponent(Label);
        this.upgradePathLabel.string = '默认路线';
        this.upgradePathLabel.fontSize = 15;
        this.upgradePathLabel.color = new Color(60, 60, 80, 255);
        this.upgradePathLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.upgradePathLabel.verticalAlign = Label.VerticalAlign.CENTER;
    }

    private refreshUpgradePathDropdown(paths: UpgradePath[]): void {
        if (!this.upgradePathDropdown) return;
        this.currentUpgradePaths = paths;
        if (paths.length === 0) {
            this.currentUpgradePaths = [{
                pathId: 'default',
                name: '默认路线',
                description: '标准成长路线',
                stages: []
            }];
        }
        if (this.upgradePathLabel) {
            const currentPathId = this.currentPet?.upgradePathId || 'default';
            const currentPath = this.currentUpgradePaths.find(p => p.pathId === currentPathId);
            this.upgradePathLabel.string = currentPath ? currentPath.name : this.currentUpgradePaths[0].name;
        }

        const existingBtns = this.upgradePathDropdown.children.filter(c => c.name === 'PathBtn');
        for (const b of existingBtns) {
            this.upgradePathDropdown.removeChild(b);
        }

        for (let i = 0; i < this.currentUpgradePaths.length; i++) {
            const p = this.currentUpgradePaths[i];
            const btnNode = new Node('PathBtn');
            this.upgradePathDropdown.addChild(btnNode);
            btnNode.setPosition(0, -54 - i * 40, 0);
            btnNode.addComponent(UITransform).setContentSize(260, 36);
            const bg = btnNode.addComponent(Graphics);
            bg.fillColor = new Color(248, 248, 252, 255);
            bg.roundRect(-130, -18, 260, 36, 8);
            bg.fill();
            bg.strokeColor = new Color(200, 200, 210, 255);
            bg.lineWidth = 1;
            bg.roundRect(-130, -18, 260, 36, 8);
            bg.stroke();

            const lblNode = new Node('Lbl');
            btnNode.addChild(lblNode);
            lblNode.addComponent(UITransform).setContentSize(240, 32);
            const lbl = lblNode.addComponent(Label);
            lbl.string = `${p.name} - ${p.description}`;
            lbl.fontSize = 13;
            lbl.color = new Color(60, 60, 80, 255);
            lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
            lbl.verticalAlign = Label.VerticalAlign.CENTER;

            const btn = btnNode.addComponent(Button);
            btn.transition = Button.Transition.SCALE;
            btn.zoomScale = 0.95;
            btnNode.on(Node.EventType.TOUCH_END, (ev: any) => {
                ev.propagationStopped = true;
                this.callbacks.onSetUpgradePath(p.pathId);
                if (this.upgradePathLabel) this.upgradePathLabel.string = p.name;
                this.showToast(`切换路线: ${p.name}`);
            }, this);
        }
    }

    private triggerImageUpload(): void {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            document.body.appendChild(input);
            input.onchange = () => {
                const file = input.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const dataUrl = e.target?.result as string;
                        if (dataUrl) {
                            this.callbacks.onUploadPetImage(dataUrl);
                            this.showToast('图片上传成功');
                        }
                    };
                    reader.readAsDataURL(file);
                }
                document.body.removeChild(input);
            };
            input.click();
        } catch (e) {
            this.showToast('图片上传功能不可用');
        }
    }

    private createAddStudentPanel(): void {
        this.addStudentPanel = new Node('AddStudentPanel');
        this.rootNode.addChild(this.addStudentPanel);
        this.addStudentPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.addStudentPanel.addComponent(UIOpacity);
        this.addStudentPanel.active = false;

        this.makeOverlay(this.addStudentPanel);

        const panel = this.makePanel(this.addStudentPanel, '添加学生', 500, 300, 0, () => { this.hideAddStudentPanel(); });

        const nameLabelNode = new Node('NameLabel');
        panel.addChild(nameLabelNode);
        nameLabelNode.setPosition(-120, 65, 0);
        nameLabelNode.addComponent(UITransform).setContentSize(96, 22);
        const nameLbl = nameLabelNode.addComponent(Label);
        nameLbl.string = '学生姓名:';
        nameLbl.fontSize = 17;
        nameLbl.color = new Color(60, 60, 80, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        const nameEditNode = new Node('NameEdit');
        panel.addChild(nameEditNode);
        nameEditNode.setPosition(30, 65, 0);
        this.addStudentNameEdit = this.makeEditBox(panel, 210, 36, 30, 65, '输入学生姓名', EditBox.InputMode.ANY, EditBox.InputFlag.DEFAULT, 17);

        this.makeButton(panel, '添加', new Color(100, 180, 255, 255), 140, 44, 0, -20, () => {
            const name = this.addStudentNameEdit?.string || '';
            if (name.trim()) {
                this.callbacks.onAddStudent(name.trim());
                this.showToast(`添加学生: ${name}`);
                this.hideAddStudentPanel();
            } else {
                this.showToast('请输入学生姓名');
            }
        });
    }

    private createCreatePetPanel(): void {
        this.createPetPanel = new Node('CreatePetPanel');
        this.rootNode.addChild(this.createPetPanel);
        this.createPetPanel.addComponent(UITransform).setContentSize(this.W, this.H);
        this.createPetPanel.addComponent(UIOpacity);
        this.createPetPanel.active = false;

        this.makeOverlay(this.createPetPanel);

        const panel = this.makePanel(this.createPetPanel, '创建宠物', 620, 500, 0, () => { this.hideCreatePetPanel(); });

        const cols = 2;
        const cardW = 260;
        const cardH = 150;
        const gap = 16;
        const startX = -(cols * (cardW + gap) - gap) / 2 + cardW / 2;
        const startY = 165;

        for (let i = 0; i < PET_DEFINITIONS.length; i++) {
            const petDef = PET_DEFINITIONS[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gap);
            const y = startY - row * (cardH + gap);

            const card = new Node(`Pet${petDef.type}`);
            panel.addChild(card);
            card.setPosition(x, y, 0);
            card.addComponent(UITransform).setContentSize(cardW, cardH);
            const cg = card.addComponent(Graphics);
            cg.fillColor = new Color(248, 248, 252, 255);
            cg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
            cg.fill();
            cg.strokeColor = new Color(200, 200, 210, 255);
            cg.lineWidth = 1.5;
            cg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
            cg.stroke();

            const previewNode = new Node('Preview');
            card.addChild(previewNode);
            previewNode.setPosition(0, 30, 0);
            previewNode.addComponent(UITransform).setContentSize(70, 70);
            const pg = previewNode.addComponent(Graphics);
            this.drawPetPreview(pg, petDef.type);

            const nameNode = new Node('Name');
            card.addChild(nameNode);
            nameNode.setPosition(0, -25, 0);
            nameNode.addComponent(UITransform).setContentSize(cardW - 16, 20);
            const nameLbl = nameNode.addComponent(Label);
            nameLbl.string = petDef.name;
            nameLbl.fontSize = 16;
            nameLbl.color = new Color(50, 50, 60, 255);
            nameLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

            const btn = card.addComponent(Button);
            btn.transition = Button.Transition.SCALE;
            btn.zoomScale = 0.95;
            card.on(Node.EventType.TOUCH_END, (ev: any) => {
                ev.propagationStopped = true;
                this.createPetSelectedType = petDef.type;
                this.refreshCreatePetSelection();
            }, this);
        }

        const customNameLabelNode = new Node('CustomNameLabel');
        panel.addChild(customNameLabelNode);
        customNameLabelNode.setPosition(-120, -145, 0);
        customNameLabelNode.addComponent(UITransform).setContentSize(96, 22);
        const cnLbl = customNameLabelNode.addComponent(Label);
        cnLbl.string = '宠物命名:';
        cnLbl.fontSize = 17;
        cnLbl.color = new Color(60, 60, 80, 255);
        cnLbl.horizontalAlign = Label.HorizontalAlign.RIGHT;

        const customNameEditNode = new Node('CustomNameEdit');
        panel.addChild(customNameEditNode);
        customNameEditNode.setPosition(30, -145, 0);
        this.createPetNameEdit = this.makeEditBox(panel, 210, 36, 30, -145, '输入宠物名', EditBox.InputMode.ANY, EditBox.InputFlag.DEFAULT, 17);

        this.makeButton(panel, '创建宠物', new Color(100, 180, 255, 255), 180, 44, 0, -205, () => {
            const name = this.createPetNameEdit?.string || '';
            if (name.trim() && this.createPetStudentId) {
                this.callbacks.onCreatePet(this.createPetStudentId, name.trim(), this.createPetSelectedType);
                this.showToast(`创建宠物: ${name}`);
                this.hideCreatePetPanel();
            } else {
                this.showToast('请输入宠物名');
            }
        });
    }

    private refreshCreatePetSelection(): void {
        if (!this.createPetPanel) return;
        const cards = this.createPetPanel.children;
        for (const child of cards) {
            this.updatePetCardSelection(child);
        }
    }

    private updatePetCardSelection(panelChild: Node): void {
        for (const child of panelChild.children) {
            if (child.name.startsWith('Pet')) {
                const g = child.getComponent(Graphics);
                if (!g) continue;
                const petType = child.name.replace('Pet', '').toLowerCase() as PetType;
                const isSelected = petType === this.createPetSelectedType;
                const cardW = 260;
                const cardH = 150;
                g.clear();
                g.fillColor = new Color(248, 248, 252, 255);
                g.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
                g.fill();
                g.strokeColor = isSelected ? new Color(100, 180, 255, 255) : new Color(200, 200, 210, 255);
                g.lineWidth = isSelected ? 3 : 1.5;
                g.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
                g.stroke();
            }
        }
    }

    private drawPetPreview(g: Graphics, petType: PetType): void {
        switch (petType) {
            case PetType.PENGUIN:
                g.fillColor = new Color(40, 40, 50, 255);
                g.ellipse(0, -4, 20, 25);
                g.fill();
                g.fillColor = new Color(240, 240, 245, 255);
                g.ellipse(0, -7, 14, 18);
                g.fill();
                g.fillColor = new Color(255, 160, 50, 255);
                g.moveTo(-4, 7);
                g.lineTo(4, 7);
                g.lineTo(0, 2);
                g.close();
                g.fill();
                g.fillColor = new Color(255, 255, 255, 255);
                g.circle(-6, 12, 3.5);
                g.fill();
                g.circle(6, 12, 3.5);
                g.fill();
                g.fillColor = new Color(20, 20, 30, 255);
                g.circle(-6, 13, 1.8);
                g.fill();
                g.circle(6, 13, 1.8);
                g.fill();
                g.fillColor = new Color(255, 140, 40, 255);
                g.ellipse(-7, -27, 7, 3.5);
                g.fill();
                g.ellipse(7, -27, 7, 3.5);
                g.fill();
                break;
            case PetType.CAT:
                g.fillColor = new Color(240, 180, 100, 255);
                g.circle(0, 0, 22);
                g.fill();
                g.moveTo(-16, 16);
                g.lineTo(-11, 29);
                g.lineTo(-3, 16);
                g.close();
                g.fill();
                g.moveTo(16, 16);
                g.lineTo(11, 29);
                g.lineTo(3, 16);
                g.close();
                g.fill();
                g.fillColor = new Color(255, 180, 180, 255);
                g.moveTo(-14, 17);
                g.lineTo(-11, 25);
                g.lineTo(-6, 17);
                g.close();
                g.fill();
                g.moveTo(14, 17);
                g.lineTo(11, 25);
                g.lineTo(6, 17);
                g.close();
                g.fill();
                g.fillColor = new Color(100, 180, 100, 255);
                g.ellipse(-7, 3, 4.5, 5.5);
                g.fill();
                g.ellipse(7, 3, 4.5, 5.5);
                g.fill();
                g.fillColor = new Color(20, 20, 30, 255);
                g.ellipse(-7, 4, 1.8, 4.5);
                g.fill();
                g.ellipse(7, 4, 1.8, 4.5);
                g.fill();
                g.fillColor = new Color(255, 150, 150, 255);
                g.ellipse(0, -3.5, 2.8, 1.8);
                g.fill();
                break;
            case PetType.DOG:
                g.fillColor = new Color(180, 130, 80, 255);
                g.circle(0, 0, 22);
                g.fill();
                g.fillColor = new Color(150, 100, 60, 255);
                g.ellipse(-20, 4, 9, 16);
                g.fill();
                g.ellipse(20, 4, 9, 16);
                g.fill();
                g.fillColor = new Color(255, 255, 255, 255);
                g.circle(-7, 4, 4.5);
                g.fill();
                g.circle(7, 4, 4.5);
                g.fill();
                g.fillColor = new Color(20, 20, 30, 255);
                g.circle(-7, 5, 2.6);
                g.fill();
                g.circle(7, 5, 2.6);
                g.fill();
                g.fillColor = new Color(30, 30, 40, 255);
                g.ellipse(0, -4.5, 4.5, 3.5);
                g.fill();
                g.fillColor = new Color(255, 120, 120, 255);
                g.ellipse(3.5, -13, 3.5, 5.5);
                g.fill();
                break;
            case PetType.RABBIT:
                g.fillColor = new Color(245, 240, 235, 255);
                g.circle(0, -4, 20);
                g.fill();
                g.ellipse(-7, 25, 6.5, 20);
                g.fill();
                g.ellipse(7, 25, 6.5, 20);
                g.fill();
                g.fillColor = new Color(255, 180, 180, 255);
                g.ellipse(-7, 25, 3.8, 16);
                g.fill();
                g.ellipse(7, 25, 3.8, 16);
                g.fill();
                g.fillColor = new Color(220, 80, 80, 255);
                g.circle(-6, 0, 3.5);
                g.fill();
                g.circle(6, 0, 3.5);
                g.fill();
                g.fillColor = new Color(255, 150, 150, 255);
                g.ellipse(0, -9, 2.8, 1.8);
                g.fill();
                break;
            case PetType.DRAGON:
                g.fillColor = new Color(80, 180, 100, 255);
                g.circle(0, -2, 22);
                g.fill();
                g.fillColor = new Color(255, 220, 80, 255);
                g.moveTo(-13, 18);
                g.lineTo(-9, 31);
                g.lineTo(-5, 18);
                g.close();
                g.fill();
                g.moveTo(13, 18);
                g.lineTo(9, 31);
                g.lineTo(5, 18);
                g.close();
                g.fill();
                g.fillColor = new Color(220, 50, 50, 255);
                g.circle(-7, 3.5, 4.5);
                g.fill();
                g.circle(7, 3.5, 4.5);
                g.fill();
                g.fillColor = new Color(20, 20, 30, 255);
                g.circle(-7, 4.5, 1.8);
                g.fill();
                g.circle(7, 4.5, 1.8);
                g.fill();
                g.fillColor = new Color(40, 40, 50, 255);
                g.circle(-3.5, -7.5, 1.8);
                g.fill();
                g.circle(3.5, -7.5, 1.8);
                g.fill();
                g.fillColor = new Color(255, 120, 40, 255);
                g.moveTo(-9, -17);
                g.lineTo(-15, -26);
                g.lineTo(-5, -21);
                g.close();
                g.fill();
                g.moveTo(9, -17);
                g.lineTo(15, -26);
                g.lineTo(5, -21);
                g.close();
                g.fill();
                break;
        }
    }

    private makeButton(
        parent: Node, text: string, color: Color,
        w: number, h: number, x: number, y: number,
        callback: () => void
    ): Node {
        const btnNode = new Node(text);
        parent.addChild(btnNode);
        btnNode.setPosition(x, y, 0);
        const t = btnNode.addComponent(UITransform);
        t.setContentSize(w, h);
        const g = btnNode.addComponent(Graphics);
        g.fillColor = color;
        g.roundRect(-w / 2, -h / 2, w, h, 12);
        g.fill();
        g.strokeColor = new Color(
            Math.max(color.r - 40, 0),
            Math.max(color.g - 40, 0),
            Math.max(color.b - 40, 0), 80
        );
        g.lineWidth = 1;
        g.roundRect(-w / 2, -h / 2, w, h, 12);
        g.stroke();

        const brightness = (color.r + color.g + color.b) / 3;
        const isLight = brightness > 160;

        const lblNode = new Node('Lbl');
        btnNode.addChild(lblNode);
        lblNode.addComponent(UITransform).setContentSize(w, h);
        const lbl = lblNode.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = 18;
        lbl.color = isLight ? new Color(40, 44, 52, 255) : new Color(255, 255, 255, 255);
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;
        lbl.overflow = Label.Overflow.CLAMP;

        const btn = btnNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 1.05;
        btn.duration = 0.08;

        btnNode.on(Node.EventType.TOUCH_END, (ev: any) => {
            ev.propagationStopped = true;
            callback();
        }, this);
        return btnNode;
    }

    private makeEditBox(
        parent: Node, w: number, h: number, x: number, y: number,
        placeholder: string, inputMode: EditBox.InputMode = EditBox.InputMode.ANY,
        inputFlag: EditBox.InputFlag = EditBox.InputFlag.DEFAULT,
        fontSize: number = 16
    ): EditBox {
        const editNode = new Node('EditBox');
        parent.addChild(editNode);
        editNode.setPosition(x, y, 0);
        editNode.layer = Layers.Enum.UI_2D;

        const ut = editNode.addComponent(UITransform);
        ut.setContentSize(w, h);
        ut.setAnchorPoint(0, 0);

        const bg = editNode.addComponent(Graphics);
        bg.fillColor = new Color(245, 247, 252, 255);
        bg.roundRect(0, 0, w, h, 6);
        bg.fill();
        bg.strokeColor = new Color(180, 185, 195, 200);
        bg.lineWidth = 1.5;
        bg.roundRect(0, 0, w, h, 6);
        bg.stroke();

        const textNode = new Node('TEXT_LABEL');
        editNode.addChild(textNode);
        textNode.layer = Layers.Enum.UI_2D;
        const textUt = textNode.addComponent(UITransform);
        textUt.setContentSize(w, h);
        textUt.setAnchorPoint(0, 0);
        const textLbl = textNode.addComponent(Label);
        textLbl.string = '';
        textLbl.fontSize = fontSize;
        textLbl.color = new Color(40, 44, 55, 255);
        textLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        textLbl.verticalAlign = VerticalTextAlignment.TOP;
        textLbl.enableWrapText = false;

        const phNode = new Node('PLACEHOLDER_LABEL');
        editNode.addChild(phNode);
        phNode.layer = Layers.Enum.UI_2D;
        const phUt = phNode.addComponent(UITransform);
        phUt.setContentSize(w, h);
        phUt.setAnchorPoint(0, 0);
        const phLbl = phNode.addComponent(Label);
        phLbl.string = placeholder;
        phLbl.fontSize = fontSize;
        phLbl.color = new Color(160, 165, 175, 255);
        phLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        phLbl.verticalAlign = VerticalTextAlignment.TOP;
        phLbl.enableWrapText = false;

        const eb = editNode.addComponent(EditBox);
        eb.fontSize = fontSize;
        eb.inputMode = inputMode;
        eb.inputFlag = inputFlag;
        eb.textColor = new Color(40, 44, 55, 255);
        eb.placeholderColor = new Color(160, 165, 175, 255);

        return eb;
    }

    private makeOverlay(parent: Node): Node {
        const overlay = new Node('Overlay');
        parent.addChild(overlay);
        overlay.addComponent(UITransform).setContentSize(this.W, this.H);
        const og = overlay.addComponent(Graphics);
        og.fillColor = new Color(0, 0, 0, 180);
        og.rect(-this.W / 2, -this.H / 2, this.W, this.H);
        og.fill();
        overlay.on(Node.EventType.TOUCH_START, (ev: any) => { ev.propagationStopped = true; }, this);
        overlay.on(Node.EventType.TOUCH_END, (ev: any) => { ev.propagationStopped = true; }, this);
        return overlay;
    }

    private makePanel(parent: Node, title: string, w: number, h: number, y: number, closeCb: () => void): Node {
        const panel = new Node('Panel');
        parent.addChild(panel);
        panel.setPosition(0, y, 0);
        panel.addComponent(UITransform).setContentSize(w, h);
        const pg = panel.addComponent(Graphics);
        pg.fillColor = new Color(255, 255, 255, 245);
        pg.roundRect(-w / 2, -h / 2, w, h, 16);
        pg.fill();
        pg.strokeColor = new Color(200, 200, 210, 255);
        pg.lineWidth = 1.5;
        pg.roundRect(-w / 2, -h / 2, w, h, 16);
        pg.stroke();

        const titleNode = new Node('Title');
        panel.addChild(titleNode);
        titleNode.setPosition(0, h / 2 - 35, 0);
        titleNode.addComponent(UITransform).setContentSize(w - 80, 32);
        const titleLbl = titleNode.addComponent(Label);
        titleLbl.string = title;
        titleLbl.fontSize = 24;
        titleLbl.color = new Color(60, 60, 80, 255);
        titleLbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        this.makeButton(panel, '✕', new Color(200, 200, 210, 255), 32, 32, w / 2 - 26, h / 2 - 35, closeCb);

        return panel;
    }

    private createToast(): void {
        this.toastNode = new Node('Toast');
        this.rootNode.addChild(this.toastNode);
        this.toastNode.addComponent(UITransform).setContentSize(360, 50);
        this.toastNode.addComponent(UIOpacity);
        this.toastNode.setPosition(0, -260, 0);
        this.toastNode.active = false;

        const bg = this.toastNode.addComponent(Graphics);
        bg.fillColor = new Color(50, 50, 60, 210);
        bg.roundRect(-180, -25, 360, 50, 14);
        bg.fill();

        const lblNode = new Node('ToastLabel');
        this.toastNode.addChild(lblNode);
        lblNode.addComponent(UITransform).setContentSize(340, 42);
        this.toastLabel = lblNode.addComponent(Label);
        this.toastLabel.fontSize = 18;
        this.toastLabel.color = new Color(255, 255, 255, 255);
        this.toastLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.toastLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this.toastLabel.overflow = Label.Overflow.CLAMP;
    }
}
