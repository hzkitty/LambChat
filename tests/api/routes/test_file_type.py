from src.api.routes.file_type import FileCategory, get_file_category


def test_cad_files_are_treated_as_documents() -> None:
    assert get_file_category("site-plan.dxf") == FileCategory.DOCUMENT
    assert get_file_category("site-plan.dwg") == FileCategory.DOCUMENT
