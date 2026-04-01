const write = (key, value) => {
	// 向localStorage写入JSON序列化后的数据。
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		console.warn("写入localStorage失败：", error);
		return false;
	} // 写入失败时返回false并打印原因。
}; // 结束写入方法。

const read = (key) => {
	// 从localStorage读取并反序列化数据。
	try {
		const text = localStorage.getItem(key);
		return text ? JSON.parse(text) : null;
	} catch {
		return null;
	} // 读取失败或解析失败时返回null。
}; // 结束读取方法。

const remove = (key) => {
	// 从localStorage删除指定键。
	try {
		localStorage.removeItem(key);
		return true;
	} catch (error) {
		console.warn("删除localStorage失败：", error);
		return false;
	} // 删除失败时返回false并打印原因。
}; // 结束删除方法。

export default { write, read, remove }; // 按命令对象风格导出，方便 LocalStorage.write() 调用。
