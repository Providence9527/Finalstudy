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
      "nodes": [
        {
          "id": "67e541f558d8e0bb89e2291c",
          "name": "Linux环境编程：从应用到内核",
          "group": "67e541f558d8e0bb89e2291c"
        },
        {
          "id": "linux_unix_technical_series",
          "name": "Linux/Unix技术丛书",
          "group": "67e541f558d8e0bb89e2291c"
        },
        {
          "id": "linux_environment_programming",
          "name": "Linux环境编程：从应用到内核",
          "group": "67e541f558d8e0bb89e2291c"
        },
        {
          "id": "gao_feng",
          "name": "高峰",
          "group": "67e541f558d8e0bb89e2291c"
        },
        {
          "id": "li_bin",
          "name": "李彬",
          "group": "67e541f558d8e0bb89e2291c"
        },
        {
          "id": "machinery_publishing",
          "name": "机械工业出版社",
          "group": "67e541f558d8e0bb89e2291c"
        },
        {
          "id": "huazhang_subsidiary",
          "name": "华章分社（北京华章图文信息有限公司，北京奥维博世图书发行有限公司）",
          "group": "67e541f558d8e0bb89e2291c"
        }
      ],
      "links": [
        {
          "source": "linux_environment_programming",
          "target": "gao_feng",
          "type": "authored_by"
        },
        {
          "source": "linux_environment_programming",
          "target": "li_bin",
          "type": "authored_by"
        },
        {
          "source": "linux_environment_programming",
          "target": "machinery_publishing",
          "type": "published_by"
        },
        {
          "source": "linux_environment_programming",
          "target": "huazhang_subsidiary",
          "type": "published_by"
        },
        {
          "source": "linux_unix_technical_series",
          "target": "67e541f558d8e0bb89e2291c",
          "type": "from"
        },
        {
          "source": "li_bin",
          "target": "67e541f558d8e0bb89e2291c",
          "type": "from"
        }
      ]
    }
    
    
  }
};