/*
 * 这个文件负责蓝图变量表达式的纯前端解析，与后端expressions.py保持同一语法。
 * 只支持数字、变量名、加减乘除、整除、括号和逗号；解析失败抛出带原因的Error。
 */

const variableNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/; // 变量名只允许字母数字下划线且不能以数字开头


// --- 把浮点整值收敛为整数 ---
const normalizeNumber = (value) => (Number.isFinite(value) && Number.isInteger(value) ? Math.trunc(value) : value); // 整除结果直接可用于层宽等整数参数


// --- 把表达式文本切成词法单元 ---
const tokenize = (text) => {
	const tokens = []; // 顺序保存{kind, value}词法单元
	let index = 0; // 当前扫描位置
	while (index < text.length) {
		const char = text[index]; // 读取当前字符
		if (/\s/.test(char)) {
			index += 1; // 空白只用于分隔，直接跳过
			continue;
		}
		if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(text[index + 1] || ""))) {
			const start = index; // 记录数字起点
			while (index < text.length && /[0-9.]/.test(text[index])) index += 1; // 连续吃掉整数和小数部分
			tokens.push({ kind: "number", value: parseFloat(text.slice(start, index)) }); // 统一按浮点读取，求值后再收敛整数
			continue;
		}
		if (/[A-Za-z_]/.test(char)) {
			const start = index; // 记录变量名起点
			while (index < text.length && /[A-Za-z0-9_]/.test(text[index])) index += 1; // 连续吃掉字母数字下划线
			tokens.push({ kind: "name", value: text.slice(start, index) }); // 变量名在求值阶段查表
			continue;
		}
		if (text.startsWith("//", index)) {
			tokens.push({ kind: "op", value: "//" }); // 整除必须先于普通除号匹配
			index += 2;
			continue;
		}
		if ("+-*/(),".includes(char)) {
			tokens.push({ kind: "op", value: char }); // 单字符运算符直接入列
			index += 1;
			continue;
		}
		throw new Error(`表达式包含无法识别的字符: ${char}`); // 其他字符一律拒绝，杜绝任何代码注入
	}
	return tokens; // 返回可被递归下降解析的词法序列
};


// --- 创建按优先级即时求值的解析器 ---
const createParser = (tokens, variables) => {
	let position = 0; // 当前解析位置

	const peek = () => tokens[position] || { kind: null, value: null }; // 越界返回空单元表示结束

	const match = (...operators) => {
		const token = peek(); // 读取但不移动
		if (token.kind === "op" && operators.includes(token.value)) {
			position += 1; // 命中后才前进
			return token.value;
		}
		return null; // 未命中保持位置不变
	};

	const requireNumber = (value, operator) => {
		if (Array.isArray(value)) throw new Error(`列表变量不能参与${operator}运算`); // 形状列表只能整体引用
		return value; // 数字原样返回给运算
	};

	const parseAtom = () => {
		const token = peek(); // 读取当前单元
		if (token.kind === "number") {
			position += 1; // 消费数字
			return token.value;
		}
		if (token.kind === "name") {
			position += 1; // 消费变量名
			if (!(token.value in variables)) throw new Error(`未定义的变量: ${token.value}`); // 未定义引用必须显式失败
			return variables[token.value]; // 变量值可以是数字或形状列表
		}
		if (match("(")) {
			const inner = parseExpression(); // 括号内是完整表达式
			if (!match(")")) throw new Error("表达式缺少右括号"); // 括号必须成对
			return inner;
		}
		throw new Error("表达式结构不完整"); // 空位置或非法开头统一报错
	};

	const parseUnary = () => {
		if (match("-")) return -requireNumber(parseUnary(), "负号"); // 负号只作用于数字
		return parseAtom(); // 无负号时读取基本单元
	};

	const parseTerm = () => {
		let value = parseUnary(); // 先取一元层结果作为左值
		while (true) {
			const operator = match("*", "//", "/");
			if (!operator) return value; // 没有后续乘除时返回当前值
			const left = requireNumber(value, operator); // 左值必须是数字
			const right = requireNumber(parseUnary(), operator); // 右值同样必须是数字
			if ((operator === "/" || operator === "//") && right === 0) throw new Error("表达式出现除以零"); // 除零直接失败
			if (operator === "*") value = left * right; // 乘法
			else if (operator === "/") value = left / right; // 真除法，整值结果稍后收敛为整数
			else value = Math.floor(left / right); // 整除
		}
	};

	const parseExpression = () => {
		let value = parseTerm(); // 先取乘除层结果作为左值
		while (true) {
			const operator = match("+", "-");
			if (!operator) return value; // 没有后续加减时返回当前值
			const left = requireNumber(value, operator); // 左值必须是数字
			const right = requireNumber(parseTerm(), operator); // 右值同样必须是数字
			value = operator === "+" ? left + right : left - right; // 立即求值保持单遍解析
		}
	};

	const parseSequence = () => {
		const values = [parseExpression()]; // 序列至少包含一个表达式
		while (match(",")) values.push(parseExpression()); // 逗号后继续读取下一项
		return values; // 返回顶层各项求值结果
	};

	return { parseSequence, isFinished: () => position === tokens.length }; // 暴露顶层入口和完整消费检查
};


// --- 解析并求值一段表达式文本 ---
const resolveText = (text, variables) => {
	let stripped = String(text).trim(); // 前后空白不影响语义
	if (stripped.startsWith("[") && stripped.endsWith("]")) stripped = stripped.slice(1, -1); // 允许用户带方括号书写形状
	if (!stripped.trim()) throw new Error("表达式不能为空"); // 空内容无法产生参数值

	const parser = createParser(tokenize(stripped), variables); // 构建单遍求值解析器
	const values = parser.parseSequence(); // 解析顶层逗号序列
	if (!parser.isFinished()) throw new Error("表达式存在多余内容"); // 未消费的词法单元说明语法错误

	const flattened = []; // 顶层序列中出现的列表变量按元素展开
	values.forEach((value) => {
		if (Array.isArray(value)) flattened.push(...value); // SHAPE这类列表变量并入序列
		else flattened.push(value); // 数字直接保留
	});

	const normalized = flattened.map(normalizeNumber); // 所有整值浮点统一收敛为整数
	if (values.length === 1 && !Array.isArray(values[0])) return normalized[0]; // 单个数字表达式返回标量
	return normalized; // 序列和列表变量统一返回数字列表
};


// --- 把蓝图变量数组转换为求值映射 ---
const getVariablesMap = (variableList) => {
	const variables = {}; // 保存已通过校验的变量
	(variableList || []).forEach((item) => {
		const name = String(item?.name || ""); // 非对象条目按无名处理
		if (!variableNamePattern.test(name)) throw new Error(`变量名无效: ${name}`); // 名称必须是合法标识符
		if (name in variables) throw new Error(`变量名重复: ${name}`); // 重名会让引用产生歧义
		variables[name] = item.value; // 数值合法性由变量面板在写入时保证
	});
	return variables; // 返回表达式求值可直接使用的映射
};


// --- 校验变量名是否合法 ---
const isValidVariableName = (name) => variableNamePattern.test(String(name || "")); // 面板创建和重命名共用同一规则


export { normalizeNumber, tokenize, resolveText, getVariablesMap, isValidVariableName }; // 导出表达式纯工具供控件、面板和测试使用
