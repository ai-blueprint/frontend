import { describe, expect, it } from "vitest"; // 引入颜色映射测试能力
import { getTensorColorStyle } from "@/utils/tensorColor.js"; // 引入张量正负颜色映射

describe("张量颜色映射", () => {
	it("使用蓝色表示负值端、白色表示零、黄色表示正值端", () => {
		expect(getTensorColorStyle(-1).backgroundColor).toBe("rgb(130 203 250)"); // 满强度负值为#82cbfa蓝色
		expect(getTensorColorStyle(0).backgroundColor).toBe("rgb(255 255 255)"); // 零值保持白色
		expect(getTensorColorStyle(1).backgroundColor).toBe("rgb(253 171 61)"); // 满强度正值为#fdab3d黄色
	});

	it("按绝对值强度从白色分别向两端颜色过渡", () => {
		expect(getTensorColorStyle(-0.5).backgroundColor).toBe("rgb(193 229 253)");
		expect(getTensorColorStyle(0.5).backgroundColor).toBe("rgb(254 213 158)");
		expect(getTensorColorStyle(0.000001).backgroundColor).toBe("rgb(255 255 255)"); // 极小值视觉上保持白色
	});

	it("使用红色标记NaN和无穷值", () => {
		expect(getTensorColorStyle(null).backgroundColor).toBe("#e44d60"); // 后端序列化后的NaN
		expect(getTensorColorStyle(Number.POSITIVE_INFINITY).backgroundColor).toBe("#e44d60");
	});
});
