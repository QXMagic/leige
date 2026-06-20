import { _decorator, Component, SpriteFrame, Font } from 'cc';
import { Theme } from './Theme';

const { ccclass, property } = _decorator;

/**
 * UI 皮肤注入组件(在 Cocos 编辑器里使用)。
 *
 * 使用步骤:
 * 1) 在场景里随便选一个常驻节点(如 Canvas 或挂 Main 的节点),添加本组件 UISkin。
 * 2) 把导入的资源拖到对应字段:
 *    - UI Font:自定义字体(TTF 资源,或 BMFont 的 .fnt)。
 *    - Panel Bg / Button Bg / Button Pressed Bg:九宫格贴图(记得在贴图属性里设置 Sliced 九宫格内边距)。
 *    - Bar Track / Bar Fill:进度条/血条 轨道与填充贴图。
 * 3) 运行即可:onLoad 会把这些资源注入 Theme,全 UI 自动应用皮肤与字体。
 *
 * 组件的 onLoad 早于 Main.start,因此 UI 构建时已能取到皮肤。
 */
@ccclass('UISkin')
export class UISkin extends Component {
    @property({ type: Font, tooltip: '自定义 UI 字体(TTF / BMFont)' })
    uiFont: Font | null = null;

    @property({ type: SpriteFrame, tooltip: '面板/卡片 九宫格底图' })
    panelBg: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: '按钮 九宫格底图' })
    buttonBg: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: '按钮 按下态 九宫格底图' })
    buttonPressedBg: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: '进度条/血条 轨道' })
    barTrack: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: '进度条/血条 填充' })
    barFill: SpriteFrame | null = null;

    onLoad() {
        Theme.setSkin({
            uiFont: this.uiFont,
            panel: this.panelBg,
            button: this.buttonBg,
            buttonPressed: this.buttonPressedBg,
            track: this.barTrack,
            fill: this.barFill,
        });
    }
}
