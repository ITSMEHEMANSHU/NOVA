import pytest
from app.graph.builder import graph_builder

def test_classify_node():
    assert graph_builder._classify_node("main.py") == "entry_point"
    assert graph_builder._classify_node("app/main.py") == "entry_point"
    assert graph_builder._classify_node("package.json") == "config"
    assert graph_builder._classify_node("tests/test_api.py") == "test"
    assert graph_builder._classify_node("src/components/Button.tsx") == "component"
    assert graph_builder._classify_node("app/api/routes/users.py") == "service"
    assert graph_builder._classify_node("src/utils/helpers.ts") == "module"

def test_extract_python_imports():
    code = """
import os
import sys
from app.core.config import settings
from typing import List, Optional
"""
    imports = graph_builder._extract_python_imports(code)
    assert "os" in imports
    assert "sys" in imports
    assert "app.core.config" in imports

def test_extract_js_ts_imports():
    code = """
import React, { useState } from 'react';
import { Button } from './components/ui/button';
const config = require('./config.json');
"""
    imports = graph_builder._extract_js_ts_imports(code)
    assert "react" in imports
    assert "./components/ui/button" in imports
    assert "./config.json" in imports
