import { _decorator, Component, Node, UITransform, Graphics, Label, Color, Button, UIOpacity, tween, ScrollView, Layout, Vec3 } from 'cc';
import { StudentData, PetData, PetType, GrowthStage, DEFAULT_STAGE_NAMES, PET_DEFINITIONS } from '../Pet/PetData';

const { ccclass } = _decorator;

/**
 * 学生宠物列表主场景组件
 * 以列表形式展示所有学生及其宠物信息
 */
@ccclass('StudentPetListScene')
export class StudentPetListScene extends Component {
    private readonly W = 960;
    private readonly H = 640;

    private scrollView: ScrollView | null = null;
    private contentNode: Node | null = null;
    private students: StudentData[] = [];
    private pets: Map<string, PetData> = new Map();
    private onSelectStudent: ((studentId: string) => void) | null = null;

    onLoad() {
        this.createBackground();
        this.createHeader();
        this.createStudentList();
    }

    /**
     * 设置学生数据
     */
    setStudents(students: StudentData[]): void {
        this.students = students;
        this.refreshList();
    }

    /**
     * 设置学生对应的宠物数据
     */
    setPet(studentId: string, pet: PetData): void {
        this.pets.set(studentId, pet);
        this.refreshList();
    }

    /**
     * 设置选择学生回调
     */
    setOnSelectStudent(callback: (studentId: string) => void): void {
        this.onSelectStudent = callback;
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        const bgNode = new Node('Background');
        this.node.addChild(bgNode);
        const t = bgNode.addComponent(UITransform);
        t.setContentSize(this.W, this.H);

        const g = bgNode.addComponent(Graphics);
        // 主背景色 - 温暖的浅蓝色
        g.fillColor = new Color(235, 245, 255, 255);
        g.rect(-this.W / 2, -this.H / 2, this.W, this.H);
        g.fill();

        // 顶部装饰条
        g.fillColor = new Color(100, 160, 255, 255);
        g.rect(-this.W / 2, this.H / 2 - 60, this.W, 60);
        g.fill();

        // 底部装饰
        g.fillColor = new Color(200, 230, 255, 255);
        g.rect(-this.W / 2, -this.H / 2, this.W, 80);
        g.fill();
    }

    /**
     * 创建顶部标题栏
     */
    private createHeader(): void {
        const headerNode = new Node('Header');
        this.node.addChild(headerNode);
        headerNode.setPosition(0, this.H / 2 - 30, 0);
        headerNode.addComponent(UITransform).setContentSize(this.W, 60);

        // 标题
        const titleNode = new Node('Title');
        headerNode.addChild(titleNode);
        titleNode.setPosition(0, 0, 0);
        titleNode.addComponent(UITransform).setContentSize(400, 40);
        const titleLbl = titleNode.addComponent(Label);
        titleLbl.string = '🎮 学生宠物乐园';
        titleLbl.fontSize = 24;
        titleLbl.color = new Color(255, 255, 255, 255);
        titleLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLbl.verticalAlign = Label.VerticalAlign.CENTER;

        // 副标题
        const subTitleNode = new Node('SubTitle');
        headerNode.addChild(subTitleNode);
        subTitleNode.setPosition(0, -35, 0);
        subTitleNode.addComponent(UITransform).setContentSize(400, 20);
        const subTitleLbl = subTitleNode.addComponent(Label);
        subTitleLbl.string = '点击学生查看宠物详情';
        subTitleLbl.fontSize = 14;
        subTitleLbl.color = new Color(150, 190, 255, 255);
        subTitleLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
    }

    /**
     * 创建学生列表滚动区域
     */
    private createStudentList(): void {
        const scrollNode = new Node('ScrollView');
        this.node.addChild(scrollNode);
        scrollNode.setPosition(0, -20, 0);
        const svUt = scrollNode.addComponent(UITransform);
        svUt.setContentSize(900, 520);

        this.scrollView = scrollNode.addComponent(ScrollView);
        this.scrollView.horizontal = false;
        this.scrollView.vertical = true;
        this.scrollView.brushMode = ScrollView.BrushMode.CONTENT_SIZE;

        // 创建View节点
        const viewNode = new Node('View');
        scrollNode.addChild(viewNode);
        viewNode.addComponent(UITransform).setContentSize(900, 520);

        // 创建Content节点
        this.contentNode = new Node('Content');
        viewNode.addChild(this.contentNode);
        const contentUt = this.contentNode.addComponent(UITransform);
        contentUt.setContentSize(900, 520);
        this.contentNode.setPosition(0, 260, 0);

        // 添加垂直布局
        const layout = this.contentNode.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.spacingY = 12;
        layout.paddingTop = 10;
        layout.paddingBottom = 10;
        layout.resizeChildren = true;

        this.scrollView.content = this.contentNode;
    }

    /**
     * 刷新学生列表
     */
    private refreshList(): void {
        if (!this.contentNode) return;
        this.contentNode.removeAllChildren();

        if (this.students.length === 0) {
            this.showEmptyState();
            return;
        }

        for (const student of this.students) {
            this.createStudentPetCard(student);
        }

        // 更新布局
        const layout = this.contentNode.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }

        // 更新内容高度
        const cardHeight = 100;
        const spacing = 12;
        const totalHeight = this.students.length * (cardHeight + spacing) + 20;
        const contentUt = this.contentNode.getComponent(UITransform);
        if (contentUt) {
            contentUt.setContentSize(900, Math.max(520, totalHeight));
        }
    }

    /**
     * 创建学生宠物卡片
     */
    private createStudentPetCard(student: StudentData): void {
        const card = new Node(`Card_${student.studentId}`);
        this.contentNode!.addChild(card);
        card.addComponent(UITransform).setContentSize(880, 100);

        // 卡片背景
        const g = card.addComponent(Graphics);
        g.fillColor = new Color(255, 255, 255, 255);
        g.roundRect(-440, -50, 880, 100, 16);
        g.fill();
        g.strokeColor = new Color(220, 230, 245, 255);
        g.lineWidth = 2;
        g.roundRect(-440, -50, 880, 100, 16);
        g.stroke();

        // 学生头像区域
        const avatarNode = new Node('StudentAvatar');
        card.addChild(avatarNode);
        avatarNode.setPosition(-380, 0, 0);
        avatarNode.addComponent(UITransform).setContentSize(64, 64);

        // 头像背景圆形
        const avatarBg = avatarNode.addComponent(Graphics);
        const avatarColor = this.getAvatarColor(student.studentId);
        avatarBg.fillColor = avatarColor;
        avatarBg.circle(0, 0, 32);
        avatarBg.fill();
        avatarBg.strokeColor = new Color(255, 255, 255, 200);
        avatarBg.lineWidth = 3;
        avatarBg.circle(0, 0, 32);
        avatarBg.stroke();

        // 学生名字首字
        const initialNode = new Node('Initial');
        avatarNode.addChild(initialNode);
        initialNode.addComponent(UITransform).setContentSize(64, 64);
        const initialLbl = initialNode.addComponent(Label);
        initialLbl.string = student.name.charAt(0);
        initialLbl.fontSize = 28;
        initialLbl.color = new Color(255, 255, 255, 255);
        initialLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        initialLbl.verticalAlign = Label.VerticalAlign.CENTER;

        // 学生信息区域
        const infoNode = new Node('Info');
        card.addChild(infoNode);
        infoNode.setPosition(-280, 15, 0);
        infoNode.addComponent(UITransform).setContentSize(200, 70);

        // 学生姓名
        const nameNode = new Node('Name');
        infoNode.addChild(nameNode);
        nameNode.setPosition(0, 20, 0);
        nameNode.addComponent(UITransform).setContentSize(200, 28);
        const nameLbl = nameNode.addComponent(Label);
        nameLbl.string = student.name;
        nameLbl.fontSize = 20;
        nameLbl.color = new Color(50, 60, 80, 255);
        nameLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        // 学生ID
        const idNode = new Node('Id');
        infoNode.addChild(idNode);
        idNode.setPosition(0, -5, 0);
        idNode.addComponent(UITransform).setContentSize(200, 18);
        const idLbl = idNode.addComponent(Label);
        idLbl.string = `ID: ${student.studentId}`;
        idLbl.fontSize = 12;
        idLbl.color = new Color(150, 160, 180, 255);
        idLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        // 分割线
        const dividerNode = new Node('Divider');
        card.addChild(dividerNode);
        dividerNode.setPosition(-120, 0, 0);
        dividerNode.addComponent(UITransform).setContentSize(2, 70);
        const dividerG = dividerNode.addComponent(Graphics);
        dividerG.fillColor = new Color(230, 235, 245, 255);
        dividerG.rect(-1, -35, 2, 70);
        dividerG.fill();

        // 宠物区域
        const pet = this.pets.get(student.studentId);
        this.createPetSection(card, pet, -20);

        // 右侧状态/操作区域
        const actionNode = new Node('Action');
        card.addChild(actionNode);
        actionNode.setPosition(350, 0, 0);
        actionNode.addComponent(UITransform).setContentSize(120, 80);

        if (pet) {
            // 宠物成长阶段标签
            const stageNode = new Node('Stage');
            actionNode.addChild(stageNode);
            stageNode.setPosition(0, 20, 0);
            stageNode.addComponent(UITransform).setContentSize(100, 26);
            const stageLbl = stageNode.addComponent(Label);
            stageLbl.string = DEFAULT_STAGE_NAMES[pet.stage] || '未知';
            stageLbl.fontSize = 14;
            stageLbl.color = new Color(255, 255, 255, 255);
            stageLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
            stageLbl.verticalAlign = Label.VerticalAlign.CENTER;

            // 阶段标签背景
            const stageBg = stageNode.addComponent(Graphics);
            const stageColor = this.getStageColor(pet.stage);
            stageBg.fillColor = stageColor;
            stageBg.roundRect(-50, -13, 100, 26, 13);
            stageBg.fill();
        } else {
            // 无宠物提示
            const noPetNode = new Node('NoPet');
            actionNode.addChild(noPetNode);
            noPetNode.setPosition(0, 10, 0);
            noPetNode.addComponent(UITransform).setContentSize(100, 30);
            const noPetLbl = noPetNode.addComponent(Label);
            noPetLbl.string = '未领养';
            noPetLbl.fontSize = 14;
            noPetLbl.color = new Color(180, 180, 190, 255);
            noPetLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        }

        // 选择按钮
        const selectBtn = this.makeButton(card, '查看', new Color(80, 160, 255, 255), 90, 36, 350, -20, () => {
            if (this.onSelectStudent) {
                this.onSelectStudent(student.studentId);
            }
        });

        // 添加点击效果
        card.addComponent(Button);
        card.on(Node.EventType.TOUCH_END, () => {
            if (this.onSelectStudent) {
                this.onSelectStudent(student.studentId);
            }
        }, this);
    }

    /**
     * 创建宠物展示区域
     */
    private createPetSection(parent: Node, pet: PetData | undefined, x: number): void {
        const petNode = new Node('PetSection');
        parent.addChild(petNode);
        petNode.setPosition(x, 0, 0);
        petNode.addComponent(UITransform).setContentSize(300, 80);

        if (!pet) {
            // 无宠物状态
            const emptyNode = new Node('Empty');
            petNode.addChild(emptyNode);
            emptyNode.setPosition(0, 0, 0);
            emptyNode.addComponent(UITransform).setContentSize(200, 30);
            const emptyLbl = emptyNode.addComponent(Label);
            emptyLbl.string = '🥚 等待领养宠物...';
            emptyLbl.fontSize = 16;
            emptyLbl.color = new Color(180, 190, 210, 255);
            emptyLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
            return;
        }

        // 宠物头像
        const petAvatarNode = new Node('PetAvatar');
        petNode.addChild(petAvatarNode);
        petAvatarNode.setPosition(-80, 0, 0);
        petAvatarNode.addComponent(UITransform).setContentSize(56, 56);

        const petAvatarBg = petAvatarNode.addComponent(Graphics);
        const petColor = this.getPetColor(pet.petType);
        petAvatarBg.fillColor = petColor;
        petAvatarBg.circle(0, 0, 28);
        petAvatarBg.fill();
        petAvatarBg.strokeColor = new Color(255, 255, 255, 200);
        petAvatarBg.lineWidth = 2;
        petAvatarBg.circle(0, 0, 28);
        petAvatarBg.stroke();

        // 宠物图标
        const petIconNode = new Node('PetIcon');
        petAvatarNode.addChild(petIconNode);
        petIconNode.addComponent(UITransform).setContentSize(56, 56);
        const petIconLbl = petIconNode.addComponent(Label);
        petIconLbl.string = this.getPetIcon(pet.petType);
        petIconLbl.fontSize = 28;
        petIconLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        petIconLbl.verticalAlign = Label.VerticalAlign.CENTER;

        // 宠物信息
        const petInfoNode = new Node('PetInfo');
        petNode.addChild(petInfoNode);
        petInfoNode.setPosition(40, 10, 0);
        petInfoNode.addComponent(UITransform).setContentSize(200, 60);

        // 宠物名称
        const petNameNode = new Node('PetName');
        petInfoNode.addChild(petNameNode);
        petNameNode.setPosition(0, 20, 0);
        petNameNode.addComponent(UITransform).setContentSize(200, 24);
        const petNameLbl = petNameNode.addComponent(Label);
        petNameLbl.string = pet.customName;
        petNameLbl.fontSize = 18;
        petNameLbl.color = new Color(80, 100, 140, 255);
        petNameLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        // 宠物类型
        const petTypeNode = new Node('PetType');
        petInfoNode.addChild(petTypeNode);
        petTypeNode.setPosition(0, -5, 0);
        petTypeNode.addComponent(UITransform).setContentSize(200, 18);
        const petTypeLbl = petTypeNode.addComponent(Label);
        const petDef = PET_DEFINITIONS.find(p => p.type === pet.petType);
        petTypeLbl.string = petDef ? `${petDef.name} · ${petDef.origin}` : '未知宠物';
        petTypeLbl.fontSize = 12;
        petTypeLbl.color = new Color(150, 160, 180, 255);
        petTypeLbl.horizontalAlign = Label.HorizontalAlign.LEFT;

        // 经验条
        const expBarNode = new Node('ExpBar');
        petInfoNode.addChild(expBarNode);
        expBarNode.setPosition(0, -22, 0);
        expBarNode.addComponent(UITransform).setContentSize(160, 8);

        const expBarBg = expBarNode.addComponent(Graphics);
        expBarBg.fillColor = new Color(230, 235, 245, 255);
        expBarBg.roundRect(-80, -4, 160, 8, 4);
        expBarBg.fill();

        const expBarFill = expBarNode.addComponent(Graphics);
        const expPercent = pet.levelExp > 0 ? pet.exp / pet.levelExp : 0;
        expBarFill.fillColor = new Color(100, 200, 150, 255);
        expBarFill.roundRect(-80, -4, 160 * Math.min(expPercent, 1), 8, 4);
        expBarFill.fill();
    }

    /**
     * 显示空状态
     */
    private showEmptyState(): void {
        const emptyNode = new Node('Empty');
        this.contentNode!.addChild(emptyNode);
        emptyNode.setPosition(0, 0, 0);
        emptyNode.addComponent(UITransform).setContentSize(400, 100);

        const emptyLbl = emptyNode.addComponent(Label);
        emptyLbl.string = '暂无学生数据\n请先添加学生';
        emptyLbl.fontSize = 18;
        emptyLbl.color = new Color(160, 170, 190, 255);
        emptyLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        emptyLbl.verticalAlign = Label.VerticalAlign.CENTER;
    }

    /**
     * 根据学生ID生成头像颜色
     */
    private getAvatarColor(studentId: string): Color {
        const colors = [
            new Color(100, 160, 255, 255),
            new Color(255, 120, 150, 255),
            new Color(120, 200, 120, 255),
            new Color(255, 180, 80, 255),
            new Color(180, 140, 255, 255),
            new Color(80, 200, 200, 255),
            new Color(255, 140, 100, 255),
            new Color(150, 180, 220, 255),
        ];
        let hash = 0;
        for (let i = 0; i < studentId.length; i++) {
            hash = ((hash << 5) - hash) + studentId.charCodeAt(i);
            hash = hash & hash;
        }
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * 根据成长阶段获取颜色
     */
    private getStageColor(stage: GrowthStage): Color {
        const colors = [
            new Color(200, 200, 210, 255),  // 蛋蛋 - 灰色
            new Color(150, 220, 180, 255),  // 幼年 - 浅绿
            new Color(100, 190, 255, 255),  // 少年 - 蓝色
            new Color(255, 180, 80, 255),   // 成年 - 橙色
            new Color(255, 140, 200, 255),  // 传说 - 粉色
        ];
        return colors[stage] || colors[0];
    }

    /**
     * 根据宠物类型获取颜色
     */
    private getPetColor(petType: PetType): Color {
        const colorMap: Record<string, Color> = {
            [PetType.PENGUIN]: new Color(120, 180, 220, 255),
            [PetType.CAT]: new Color(255, 160, 180, 255),
            [PetType.DOG]: new Color(200, 180, 140, 255),
            [PetType.RABBIT]: new Color(200, 220, 160, 255),
            [PetType.DRAGON]: new Color(255, 140, 100, 255),
            [PetType.CUSTOM]: new Color(180, 160, 200, 255),
        };
        return colorMap[petType] || new Color(180, 180, 180, 255);
    }

    /**
     * 根据宠物类型获取图标
     */
    private getPetIcon(petType: PetType): string {
        const iconMap: Record<string, string> = {
            [PetType.PENGUIN]: '🐧',
            [PetType.CAT]: '🐱',
            [PetType.DOG]: '🐕',
            [PetType.RABBIT]: '🐰',
            [PetType.DRAGON]: '🐲',
            [PetType.CUSTOM]: '🎨',
        };
        return iconMap[petType] || '🥚';
    }

    /**
     * 创建按钮辅助方法
     */
    private makeButton(
        parent: Node,
        label: string,
        color: Color,
        width: number,
        height: number,
        x: number,
        y: number,
        onClick: () => void
    ): Node {
        const btnNode = new Node(`Btn_${label}`);
        parent.addChild(btnNode);
        btnNode.setPosition(x, y, 0);
        btnNode.addComponent(UITransform).setContentSize(width, height);

        const g = btnNode.addComponent(Graphics);
        g.fillColor = color;
        g.roundRect(-width / 2, -height / 2, width, height, height / 2);
        g.fill();

        const lblNode = new Node('Label');
        btnNode.addChild(lblNode);
        lblNode.addComponent(UITransform).setContentSize(width, height);
        const lbl = lblNode.addComponent(Label);
        lbl.string = label;
        lbl.fontSize = 14;
        lbl.color = new Color(255, 255, 255, 255);
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        const btn = btnNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.95;
        btn.duration = 0.08;

        btnNode.on(Node.EventType.TOUCH_END, (ev: any) => {
            ev.propagationStopped = true;
            onClick();
        }, this);

        return btnNode;
    }
}
