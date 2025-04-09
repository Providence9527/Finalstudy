// src/data/mockReports.js
export const mockReports = {
  daily: {
    stats: {
      duration: "2.5h",
      concepts: 8,
      focusArea: "React Hooks"
    },
    advice: "建议加强useEffect的依赖项管理练习，完成3个Hook相关实践项目",
    graph: {
      nodes: [
        { id: "useState", name: "useState", group: "hook" },
        { id: "useEffect", name: "useEffect", group: "hook" }
      ],
      links: [{ source: "useState", target: "useEffect" }]
    }
  },
  weekly: {
    stats: {
      duration: "18h",
      concepts: 35,
      focusArea: "状态管理"
    },
    advice: "本周可重点学习Redux Toolkit，尝试在项目中实现全局状态管理",
    graph: {
      nodes: [
        { id: "Redux", name: "Redux", group: "state" },
        { id: "Context", name: "Context", group: "state" }
      ],
      links: [{ source: "Redux", target: "Context" }]
    }
  },
  monthly: {
    stats: {
      duration: "75h",
      concepts: 120,
      focusArea: "前端架构"
    },
    advice: "本月建议学习微前端架构，完成模块化项目拆分实践",
    graph: {
      nodes: [
        { id: "MicroFrontend", name: "微前端", group: "arch" },
        { id: "ModuleFederation", name: "模块联邦", group: "arch" }
      ],
      links: [{ source: "MicroFrontend", target: "ModuleFederation" }]
    }
  }
};