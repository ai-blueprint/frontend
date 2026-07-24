import { describe, expect, it } from "vitest"; // 引入颜色映射测试能力
import { getTensorColorStyle } from "@/utils/tensorColor.js"; // 引入张量正负颜色映射

describe("张量颜色映射", () => {
	it("使用黄色表示负数、白色表示零、蓝色表示正数", () => {
		expect(getTensorColorStyle(-1).backgroundColor).toBe("rgb(255 213 79)"); // 满强度负值为黄色
		expect(getTensorColorStyle(0).backgroundColor).toBe("rgb(255 255 255)"); // 零值保持白色
		expect(getTensorColorStyle(1).backgroundColor).toBe("rgb(21 101 192)"); // 满强度正值为蓝色
	});

	it("按绝对值强度从白色分别向两端颜色过渡", () => {
		expect(getTensorColorStyle(-0.5).backgroundColor).toBe("rgb(255 234 167)");
		expect(getTensorColorStyle(0.5).backgroundColor).toBe("rgb(138 178 224)");
	});
});
