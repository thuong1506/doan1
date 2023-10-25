import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Radio,
  Row,
  Space,
  Table,
  Tooltip,
} from "antd";
import { Icon } from "@iconify/react";
import styled from "styled-components";
import { RootState } from "../features/store";
import { firestore } from "../firebase/config";
import { TicketData, setShowDateChangeOverlay } from "../features/ticketSlice";
import {
  setTickets,
  setShowOverlay,
  setFilterValue,
  setDefaultValue,
} from "../features/ticketSlice";
import { setCurrentPage } from "../features/ticketPackSlice";
import { useCallback } from "react";
import { CheckboxValueType } from "antd/es/checkbox/Group";
import Navbar from "../components/navbar";
import SearchNotificationBar from "../components/search";
import { Dayjs } from "dayjs";

const StyledTicket = styled.div`
  background-color: #f9f6f4;
`;

type TablePaginationPosition =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

const TransparentButton = styled.button`
  font-family: monospace;
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding-bottom: 10px;
  margin-right: 12px;
`;

const customColors = ["var(--yellow-05, #FFD2A8)"];

const TableWithPagination: React.FC = () => {
  const [displayMode, setDisplayMode] = useState<"GD" | "SK">("GD");

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
    },
    {
      title: "Booking Code",
      dataIndex: "bookingCode",
      className: "no-wrap",
      key: "bookingCode",
      render: (
        text:
          | string
          | number
          | boolean
          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
          | Iterable<React.ReactNode>
          | React.ReactPortal
          | null
          | undefined
      ) => <a>{text}</a>,
    },
    {
      title: "Số vé",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
    },
    {
      title: "Tên sự kiện",
      dataIndex: "nameEvent",
      key: "nameEvent",
      className: "no-wrap",
    },

    {
      title: "Tình trạng sử dụng",
      dataIndex: "usageStatus",
      key: "usageStatus",
      className: "no-wrap",
      render: (
        status:
          | string
          | number
          | boolean
          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
          | Iterable<React.ReactNode>
          | null
          | undefined
      ) => (
        <span
          className={
            status === "Đã sử dụng"
              ? "used"
              : status === "Chưa sử dụng"
              ? "not-used"
              : status === "Hết hạn"
              ? "expired"
              : ""
          }
        >
          <Icon icon="ion:ellipse" style={{ marginRight: "8px" }} />
          {status}
        </span>
      ),
    },
    {
      title: "Ngày sử dụng",
      dataIndex: "usageDate",
      key: "usageDate",
    },
    {
      title: "Ngày xuất vé",
      dataIndex: "ticketDate",
      key: "ticketDate",
    },
    {
      title: "Cổng check-in",
      dataIndex: "checkInGate",
      key: "checkInGate",
      render: (gate: any) => (gate ? gate : <span>-</span>),
    },

    {
      title: "",
      key: "actions",
      render: (text: any, ticket: TicketData) => (
        <td className="icon-cell">
          {ticket.usageStatus === "Chưa sử dụng" ? (
            <Space wrap>
              {customColors.map((color) => (
                <Tooltip
                  placement="left"
                  title={
                    <div className="tooltip-content">
                      <Button
                        className="tooltip-button"
                        onClick={() =>
                          handleUseTicketClick(ticket.ticketNumber)
                        }
                      >
                        Sử dụng vé
                      </Button>
                      <Button
                        className="tooltip-button"
                        onClick={() => openDateChangeOverlay(ticket)}
                      >
                        Đổi ngày sử dụng
                      </Button>
                    </div>
                  }
                  color={color}
                  key={color}
                >
                  <Icon icon="nimbus:ellipsis" />
                </Tooltip>
              ))}
            </Space>
          ) : ticket.usageStatus === "Đã sử dụng" ||
            ticket.usageStatus === "Hết hạn" ? (
            ""
          ) : (
            ticket.checkInGate
          )}
        </td>
      ),
    },
  ];

  const updateTicketStatus = async (ticketNumber: any) => {
    try {
      // Tìm vé trong cơ sở dữ liệu bằng số vé (hoặc mã vé)
      const ticketRef = firestore
        .collection("tickets")
        .where("ticketNumber", "==", ticketNumber);
      const snapshot = await ticketRef.get();

      if (snapshot.empty) {
        console.log("Không tìm thấy vé với số vé (hoặc mã vé) cần cập nhật.");
        return;
      }

      // Cập nhật trạng thái sử dụng của vé tìm được
      const ticketId = snapshot.docs[0].id;
      await firestore
        .collection("tickets")
        .doc(ticketId)
        .update({ usageStatus: "Đã sử dụng" });

      console.log("Cập nhật trạng thái sử dụng của vé thành công.");
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const currentPage = useSelector(
    (state: RootState) => state.ticketPack.currentPage
  );

  const filterValue = useSelector(
    (state: RootState) => state.ticket.filterValue
  );

  const defaultValue = useSelector(
    (state: RootState) => state.ticket.defaultValue
  );

  const tickets = useSelector((state: RootState) => state.ticket.tickets);

  const [newUsageDate, setNewUsageDate] = useState<Dayjs | null>(null);

  const showOverlay = useSelector(
    (state: RootState) => state.ticket.showOverlay
  );

  const showDateChangeOverlay = useSelector(
    (state: RootState) => state.ticket.showDateChangeOverlay
  );

  const dispatch = useDispatch();

  const [filteredTickets, setFilteredTickets] = useState([] as TicketData[]);

  const [selectedGates, setSelectedGates] = useState<string[]>([]);

  const [isFiltered, setIsFiltered] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);

  const [endDate, setEndDate] = useState<Date | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  const [usageDate, setUsageDate] = useState<Date | null>(null);

  const rowsPerPage = 4;

  const startIndex: number = (currentPage - 1) * rowsPerPage;

  const [counter, setCounter] = useState<number>(0); // Khởi tạo biến đếm và đặt giá trị ban đầu là 0.

  // Hàm tính lại STT khi hiển thị kết quả lọc

  const calculateFilteredIndex = (index: number): number =>
    startIndex + index + 1;

  const calculateIndex = (index: number): number => startIndex + index + 1;

  const [searchTerm, setSearchTerm] = useState<string>("");

  const filterSearchResults = (searchTerm: string) => {
    const searchResults = tickets.filter((ticket) =>
      ticket.ticketNumber.includes(searchTerm)
    );

    // Kiểm tra xem có từ khóa tìm kiếm hay không. Nếu không có, sử dụng nguồn dữ liệu gốc.
    const filteredData = searchTerm ? searchResults : dataSource;

    // Cập nhật lại STT cho kết quả lọc
    const filteredWithIndex = filteredData.map((ticket, index) => ({
      ...ticket,
      index: calculateFilteredIndex(index),
    }));

    setFilteredTickets(filteredWithIndex);
    setIsFiltered(!!searchTerm); // Đặt thành true nếu có từ khóa tìm kiếm.
    setCounter(0); // Reset lại biến đếm khi thực hiện tìm kiếm.
  };

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value);
    filterSearchResults(event.target.value); // Kích hoạt tìm kiếm dựa trên giá trị nhập vào.
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const snapshot = await firestore.collection("tickets").get();
        const ticketData = snapshot.docs.map((doc) => doc.data() as TicketData);
        dispatch(setTickets(ticketData));
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };

    fetchTickets();
  }, [dispatch]);

  const handleUseTicketClick = async (ticketNumber: string) => {
    try {
      // Thực hiện hàm cập nhật trạng thái sử dụng của vé bằng số vé (hoặc mã vé)
      await updateTicketStatus(ticketNumber);

      // Lấy danh sách vé hiện tại từ Redux
      const currentTickets = [...tickets];

      // Tìm vé được cập nhật trong danh sách và cập nhật trạng thái sử dụng
      const updatedTickets = currentTickets.map((ticket) =>
        ticket.ticketNumber === ticketNumber
          ? { ...ticket, usageStatus: "Đã sử dụng" }
          : ticket
      );

      // Cập nhật danh sách vé trong Redux
      dispatch(setTickets(updatedTickets));
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const exportToCSV = () => {
    // Chuẩn bị dữ liệu để xuất ra file .csv
    let csvContent = "";

    // Định dạng tiêu đề cột
    const headers = [
      "STT",
      "Booking Code",
      "Số vé",
      "Tên sự kiện",
      "Tình trạng sử dụng",
      "Ngày sử dụng",
      "Ngày xuất vé",
      "Cổng check-in",
    ];
    csvContent += headers.join(",") + "\n";

    // Lọc và định dạng nội dung từng dòng theo ticketType
    const filteredTickets = tickets.filter(
      (ticket) =>
        displayMode === "GD"
          ? ticket.ticketType === "GD" // Lọc vé gia đình
          : ticket.ticketType === "SK" // Lọc vé sự kiện
    );
    filteredTickets.forEach((ticket, index) => {
      const row = [
        index + 1,
        ticket.bookingCode,
        ticket.ticketNumber,
        ticket.nameEvent,
        ticket.usageStatus,
        ticket.usageDate,
        ticket.ticketDate,
        ticket.checkInGate,
      ];

      // Join the row values and handle special characters
      csvContent +=
        '"' +
        row.map((value) => String(value).replace(/"/g, '""')).join('","') +
        '"\n';
    });

    // Tạo đối tượng Blob với dữ liệu CSV và định dạng tiếng Việt
    const blob = new Blob(["\ufeff", csvContent], {
      type: "text/csv;charset=utf-8",
    });

    // Tạo URL cho Blob và tạo link để download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDisplayModeChange = (mode: "GD" | "SK") => {
    setIsFiltered(false);
    setFilteredTickets([]); // Reset lại state filteredTickets
    dispatch(setCurrentPage(1)); // Reset lại trang hiện tại về trang đầu tiên
    dispatch(setFilterValue(["tatcacong"])); // Reset lại giá trị lọc về "Tất cả"
    dispatch(setDefaultValue("tatca")); // Reset lại giá trị mặc định về "Tất cả"
    setDisplayMode(mode);
  };

  const handleCheckAllChange = (e: any) => {
    const checked = e.target.checked;
    const allGates = [
      "tatcacong",
      "Cổng 1",
      "Cổng 2",
      "Cổng 3",
      "Cổng 4",
      "Cổng 5",
    ];
    setSelectedGates(checked ? allGates : []);
    dispatch(setFilterValue(checked ? ["tatcacong"] : []));
  };

  const handleCheckboxChange = (checkedValues: CheckboxValueType[]) => {
    setSelectedGates(checkedValues as string[]);
    dispatch(setFilterValue(checkedValues as string[]));
  };
  const handleChange = (e: any) => {
    dispatch(setDefaultValue(e.target.value));
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const filterTickets = useCallback(
    (tickets: TicketData[], filterValue: string[], defaultValue: string) => {
      console.log("defaultValue: ", defaultValue);

      return tickets.filter((ticket) => {
        // Lọc theo ticketType
        if (
          (displayMode === "GD" && ticket.ticketType !== "GD") ||
          (displayMode === "SK" && ticket.ticketType !== "SK")
        ) {
          return false;
        }

        // Lọc theo trạng thái sử dụng
        let passUsageStatusFilter = false;
        if (defaultValue === "tatca") {
          passUsageStatusFilter = true;
        } else if (defaultValue === "dasd") {
          passUsageStatusFilter = ticket.usageStatus === "Đã sử dụng";
        } else if (defaultValue === "chuasd") {
          passUsageStatusFilter = ticket.usageStatus === "Chưa sử dụng";
        } else if (defaultValue === "hethan") {
          passUsageStatusFilter = ticket.usageStatus === "Hết hạn";
        }

        // Lọc theo cổng check-in
        const passCheckInGateFilter =
          filterValue.includes("tatcacong") ||
          selectedGates.includes(ticket.checkInGate);

        // Kết hợp cả hai điều kiện
        return passUsageStatusFilter && passCheckInGateFilter;
      });
    },
    [displayMode, selectedGates]
  );

  const handleStartDateChange = (date: any) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: any) => {
    setEndDate(date);
  };

  // Hàm xử lý sự kiện khi người dùng nhấp vào nút "Lọc"
  const handleFilterClick = () => {
    const filteredTickets = filterTickets(tickets, filterValue, defaultValue);

    setFilteredTickets(filteredTickets); // Cập nhật state filteredTickets sau khi lọc dữ liệu
    setIsFiltered(true);
    console.log(filterValue);
    console.log(defaultValue);

    dispatch(setShowOverlay(false));
  };

  const handleFilterButtonClick = () => {
    dispatch(setShowOverlay(true));
  };

  const openDateChangeOverlay = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    dispatch(setShowDateChangeOverlay(true));
  };

  const closeDateChangeOverlay = () => {
    setSelectedTicket(null);
    dispatch(setShowDateChangeOverlay(false));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Check for an invalid date
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day < 10 ? "0" + day : day}/${
      month < 10 ? "0" + month : month
    }/${year}`;
  };

  const saveNewUsageDate = async () => {
    try {
      if (!selectedTicket || !newUsageDate) {
        console.error(
          "Không tìm thấy vé được chọn hoặc ngày sử dụng không hợp lệ."
        );
        return;
      }

      // Tìm tài liệu dựa trên ticketNumber
      const ticketRef = firestore
        .collection("tickets")
        .where("ticketNumber", "==", selectedTicket.ticketNumber);
      const ticketSnapshot = await ticketRef.get();

      if (ticketSnapshot.empty) {
        console.error(
          "Không tìm thấy vé với số vé đã chọn trong cơ sở dữ liệu."
        );
        return;
      }

      // Vì có thể có nhiều vé có cùng số vé, ta chọn vé đầu tiên trong danh sách kết quả
      const ticketDoc = ticketSnapshot.docs[0];

      // Định dạng lại newUsageDate trước khi lưu vào Firestore
      const formattedNewUsageDate = formatDate(newUsageDate.toISOString());

      // Tiếp tục xử lý cập nhật tài liệu
      await ticketDoc.ref.update({ usageDate: formattedNewUsageDate });

      // Cập nhật trạng thái ngày sử dụng của vé trong danh sách
      const updatedTickets = tickets.map((ticket) =>
        ticket.ticketNumber === selectedTicket.ticketNumber
          ? { ...ticket, usageDate: formattedNewUsageDate }
          : ticket
      );
      dispatch(setTickets(updatedTickets));
      dispatch(setShowDateChangeOverlay(false));
    } catch (error) {
      console.error("Lỗi khi cập nhật ngày sử dụng:", error);
    }
  };

  const dataSource = useMemo(() => {
    // Lọc và tạo mảng mới chứa các vé tương ứng với `ticketType`
    const filteredTickets = tickets.filter((ticket) =>
      displayMode === "GD"
        ? ticket.ticketType === "GD"
        : ticket.ticketType === "SK"
    );

    // Kiểm tra nếu có kết quả tìm kiếm thì sử dụng kết quả đã tìm kiếm, nếu không thì sử dụng dữ liệu nguồn ban đầu
    const dataToUse = isFiltered
      ? filteredTickets
      : filteredTickets.map((ticket, index) => ({
          ...ticket,
          index: calculateIndex(index),
        }));

    // Tính lại STT cho kết quả lọc
    const dataWithFilteredIndex = dataToUse.map((ticket, index) => ({
      ...ticket,
      index: isFiltered ? calculateFilteredIndex(index) : calculateIndex(index),
    }));

    return dataWithFilteredIndex;
  }, [
    tickets,
    isFiltered,
    displayMode,
    calculateIndex,
    calculateFilteredIndex,
  ]);

  const [bottom] = useState<TablePaginationPosition>("bottomCenter");

  const filteredColumns =
    displayMode === "GD"
      ? columns.filter((column) => column.key !== "nameEvent")
      : columns;

  return (
    <StyledTicket>
      <div className="app">
        <Navbar />
        <div className="container-main">
          <SearchNotificationBar />
          <div className="content">
            <div className="content-main">
              <div className="title">
                <h2 className="noo-sh-title">Danh sách vé</h2>
              </div>

              <div className="category">
                <TransparentButton
                  style={{
                    borderBottom:
                      displayMode === "GD" ? "4px solid orange" : "none",
                  }}
                  onClick={() => handleDisplayModeChange("GD")}
                >
                  Vé gia đình
                </TransparentButton>
                <TransparentButton
                  style={{
                    borderBottom:
                      displayMode === "SK" ? "4px solid orange" : "none",
                  }}
                  onClick={() => handleDisplayModeChange("SK")}
                >
                  Vé sự kiện
                </TransparentButton>
              </div>
              <div className="search-filter">
                <div className="search-ticket">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm bằng số vé"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                  />
                  <Icon
                    icon="material-symbols:search"
                    className="search-ticket-icon"
                  />
                </div>
                <div className="filter">
                  <div>
                    <button onClick={handleFilterButtonClick}>
                      <Icon icon="lucide:filter" className="icon-ticket" />
                      Lọc vé
                    </button>
                    <button onClick={exportToCSV}>Xuất file (.CSV)</button>
                  </div>
                </div>
              </div>
              {/* The table component goes here */}
              <div className="ticket-table">
                <Table
                  columns={filteredColumns}
                  dataSource={isFiltered ? filteredTickets : dataSource}
                  pagination={{
                    position: [bottom],
                    current: currentPage,
                    pageSize: rowsPerPage,
                    total: tickets.length,
                    onChange: handlePageChange,
                    className: "custom-pagination",
                  }}
                />
              </div>
              {/* End of table component */}
            </div>
          </div>
        </div>
      </div>
      {showOverlay && (
        <div className="overlay">
          <div className="overlay-content-1">
            <p>Lọc vé</p>
            <div className="overlay-filter">
              <div className="row pt-2">
                <div className="col">
                  <span>Từ ngày</span>
                </div>
                <div className="col">
                  <span>Đến ngày</span>
                </div>
              </div>
              <div className="row pt-2">
                <div className="col">
                  <Space direction="vertical">
                    <DatePicker
                      onChange={handleStartDateChange}
                      format="DD/MM/YYYY"
                    />
                  </Space>
                </div>
                <div className="col">
                  <Space direction="vertical">
                    <DatePicker
                      onChange={handleEndDateChange}
                      format="DD/MM/YYYY"
                    />
                  </Space>
                </div>
              </div>
              <div className="row pt-3">
                <span>Tình trạng sử dụng</span>
              </div>
              <div className="row pt-2">
                <Radio.Group
                  name="radiogroup"
                  value={defaultValue}
                  onChange={handleChange}
                  className="d-flex justify-content-between"
                >
                  <Radio value="tatca">Tất cả</Radio>
                  <Radio value="dasd">Đã sử dụng</Radio>
                  <Radio value="chuasd">Chưa sử dụng</Radio>
                  <Radio value="hethan">Hết hạn</Radio>
                </Radio.Group>
              </div>
              <div className="row pt-3">
                <span>Cổng check-in</span>
              </div>
              <div className="row pt-2">
                <Checkbox.Group
                  style={{ width: "100%" }}
                  value={filterValue}
                  onChange={handleCheckboxChange}
                >
                  <Row>
                    <Col span={8}>
                      <Checkbox
                        value="tatcacong"
                        onChange={handleCheckAllChange}
                        checked={filterValue.includes("tatcacong")}
                      >
                        Tất cả
                      </Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox
                        value="Cổng 1"
                        disabled={filterValue.includes("tatcacong")}
                      >
                        Cổng 1
                      </Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox
                        value="Cổng 2"
                        disabled={filterValue.includes("tatcacong")}
                      >
                        Cổng 2
                      </Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox
                        value="Cổng 3"
                        disabled={filterValue.includes("tatcacong")}
                      >
                        Cổng 3
                      </Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox
                        value="Cổng 4"
                        disabled={filterValue.includes("tatcacong")}
                      >
                        Cổng 4
                      </Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox
                        value="Cổng 5"
                        disabled={filterValue.includes("tatcacong")}
                      >
                        Cổng 5
                      </Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </div>
            </div>
            <div className="filter pt-4">
              <div className="filter-ticket">
                <button onClick={handleFilterClick}>Lọc</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDateChangeOverlay && selectedTicket && (
        <div className="overlay">
          <div className="overlay-content-2">
            <h4 className="title-chart">Đổi ngày sử dụng vé</h4>
            <div className="overlay-filter mt-5">
              <div className="row">
                <div className="col-4">Số vé</div>
                <div className="col">{selectedTicket.ticketNumber}</div>
              </div>
              <div className="row mt-4">
                <div className="col-4">Loại vé</div>
                <div className="col">{selectedTicket.ticketTypeName}</div>
              </div>
              <div className="row mt-4">
                <div className="col-4">Tên sự kiện</div>
                <div className="col">{selectedTicket.nameEvent}</div>
              </div>
              <div className="row mt-4">
                <div className="col-4">Hạn sử dụng</div>
                <div className="col">
                  <Space direction="vertical">
                    <DatePicker
                      value={newUsageDate}
                      onChange={(date) => setNewUsageDate(date)}
                      format="DD/MM/YYYY"
                    />
                  </Space>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <div className="filter-ticket">
                <button onClick={closeDateChangeOverlay}>Hủy</button>
                <button className="filter-filter-2" onClick={saveNewUsageDate}>
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StyledTicket>
  );
};

export default TableWithPagination;
