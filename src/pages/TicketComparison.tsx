import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Navbar from "../components/navbar";
import "./pages.css";
import SearchNotificationBar from "../components/search";
import { Icon } from "@iconify/react";
import { Select, Table } from "antd";
import { Radio } from "antd";
import type { DatePickerProps } from "antd";
import { DatePicker, Space } from "antd";
import { firestore } from "../firebase/config";
import { TicketData, setTickets } from "../features/ticketSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../features/store";

const StyledTicketComparison = styled.div`
  background-color: #f9f6f4;
`;

type TablePaginationPosition =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

const TicketComparison = () => {
  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      width: 18,
    },
    {
      title: "Số vé",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 22,
    },
    {
      title: "Tên Sự kiện",
      dataIndex: "nameEvent",
      key: "nameEvent",
      className: "no-wrap",
      width: 48,
    },
    {
      title: "Ngày sử dụng",
      dataIndex: "usageDate",
      key: "usageDate",
      className: "no-wrap",
    },
    {
      title: "Loại vé",
      dataIndex: "ticketTypeName",
      key: "ticketTypeName",
      ellipsis: true,
      width: 25,
    },
    {
      title: "Cổng Check-in",
      dataIndex: "checkInGate",
      key: "checkInGate",
    },
    {
      title: "Trạng thái đối soát",
      dataIndex: "reconciliationStatus",
      key: "reconciliationStatus",
      width: 40,
      render: (
        reconciliationStatus:
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
            reconciliationStatus === "Đã đối soát"
              ? "reconciliation-status-red"
              : "reconciliation-status-italic-gray"
          }
        >
          {reconciliationStatus}
        </span>
      ),
    },
  ];
  const dispatch = useDispatch();
  const [ticketData, setTicketData] = useState<TicketData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6; // Số hàng hiển thị trên mỗi trang

  useEffect(() => {
    // Fetch tickets and set ticketData and filteredTicketData
    const fetchTickets = async () => {
      try {
        const snapshot = await firestore.collection("tickets").get();
        const ticketData = snapshot.docs.map((doc) => doc.data() as TicketData);
        dispatch(setTickets(ticketData));
        setTicketData(ticketData);
        setFilteredTicketData(ticketData);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };

    fetchTickets();
  }, [dispatch]);

  const [selectedReconciliationStatus, setSelectedReconciliationStatus] =
    useState<string>("tatca");
  const [filteredTicketData, setFilteredTicketData] = useState<TicketData[]>(
    []
  );

  const handleReconciliation = async () => {
    try {
      // Update reconciliation status in Firestore
      const querySnapshot = await firestore
        .collection("tickets")
        .where("reconciliationStatus", "==", "Chưa đối soát")
        .get();
      const batch = firestore.batch();
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { reconciliationStatus: "Đã đối soát" });
      });
      await batch.commit();

      // Update ticketData and filteredTicketData
      const updatedTicketData = ticketData.map((ticket) => {
        if (ticket.reconciliationStatus === "Chưa đối soát") {
          return {
            ...ticket,
            reconciliationStatus: "Đã đối soát",
          };
        }
        return ticket;
      });

      setTicketData(updatedTicketData);
      setFilteredTicketData(updatedTicketData);
    } catch (error) {
      console.error("Error updating reconciliation status:", error);
    }
  };

  const [eventNameFilter, setEventNameFilter] = useState<string | null>(null);

  const handleEventNameFilterChange = (value: string) => {
    setEventNameFilter(value);
  };

  const handleFilterClick = () => {
    const filteredResults = ticketData.filter((ticket) => {
      const eventNameMatches =
        eventNameFilter === null || ticket.nameEvent === eventNameFilter;

      const reconciliationStatusMatches =
        selectedReconciliationStatus === "tatca" ||
        (selectedReconciliationStatus === "dadoisoat" &&
          ticket.reconciliationStatus === "Đã đối soát") ||
        (selectedReconciliationStatus === "chuadoisoat" &&
          ticket.reconciliationStatus === "Chưa đối soát");

      return eventNameMatches && reconciliationStatusMatches;
    });

    setFilteredTicketData(filteredResults);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    // Xử lý sự kiện thay đổi trang ở đây
    console.log("Trang hiện tại:", page);
  };

  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
  };
  const [value, setValue] = useState("tatca");

  const handleChange = (e: any) => {
    setValue(e.target.value);
    setSelectedReconciliationStatus(e.target.value);
  };

  // Bên trong thành phần TicketComparison
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Bên trong thành phần TicketComparison
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);
    filterSearchResults(searchValue); // Kích hoạt tìm kiếm dựa trên giá trị nhập vào.
  };
  const filterSearchResults = (searchTerm: string) => {
    const searchResults = ticketData.filter(
      (ticket) =>
        ticket.ticketNumber.includes(searchTerm) ||
        ticket.reconciliationStatus.includes(searchTerm)
    );

    // Đánh STT cho danh sách vé sau khi tìm kiếm
    const searchResultsWithStt = searchResults.map((ticket, index) => ({
      ...ticket,
      stt: index + 1,
    }));

    // Cập nhật danh sách vé hiển thị dựa trên kết quả tìm kiếm
    setFilteredTicketData(searchResultsWithStt);
  };

  const [bottom] = useState<TablePaginationPosition>("bottomCenter");

  const tickets = useSelector((state: RootState) => state.ticket.tickets);

  return (
    <StyledTicketComparison>
      <div className="app">
        <Navbar />
        <div className="container-main">
          <SearchNotificationBar />
          <div className="total-content">
            <div className="content-1">
              <div className="content-main-1">
                <h2 className="noo-sh-title">Đối soát vé</h2>
                <div className="search-filter">
                  <div className="search-ticket">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm bằng số vé"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                    <Icon
                      icon="material-symbols:search"
                      className="search-ticket-icon"
                    />
                  </div>
                  <div className="filter-check">
                    <div>
                      <button onClick={handleReconciliation}>
                        Chốt đối soát
                      </button>
                    </div>
                  </div>
                </div>
                <div className="ticket-table">
                  <Table
                    columns={columns}
                    dataSource={
                      filteredTicketData.length > 0
                        ? filteredTicketData.map((ticket, index) => ({
                            ...ticket,
                            stt: index + 1,
                          }))
                        : []
                    }
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
              </div>
            </div>
            <div className="content-2">
              <div className="content-main-2">
                <h5 className="noo-sh-title-filter">Lọc vé</h5>
                <div className="filter-title-checkbox row">
                  <Select
                    className="select-ticket"
                    showSearch
                    placeholder="Chọn tên sự kiện"
                    optionFilterProp="children"
                    onChange={handleEventNameFilterChange}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={[
                      {
                        value: "Sự kiện triển lãm robot",
                        label: "Sự kiện triển lãm robot",
                      },
                      {
                        value: "Sự kiện ra mắt VF9",
                        label: "Sự kiện ra mắt VF9",
                      },
                      {
                        value: "Chung kết C1",
                        label: "Chung kết C1",
                      },
                    ]}
                  />
                  <div className="col pt-3">
                    <p className="title-filter">Trình trạng đối soát</p>
                  </div>
                  <div className="col pt-3">
                    <Radio.Group
                      name="radiogroup"
                      value={value}
                      onChange={handleChange}
                    >
                      <Radio value="tatca">Tất cả</Radio>
                      <Radio value="dadoisoat" className="no-wrap">
                        Đã đối soát
                      </Radio>
                      <Radio value="chuadoisoat" className="no-wrap">
                        Chưa đối soát
                      </Radio>
                    </Radio.Group>
                  </div>
                </div>
                <div className="row pt-2">
                  <div className="col">
                    {" "}
                    <p className="title-filter">Loại vé</p>
                  </div>
                  <div className="col">Vé cổng</div>
                </div>
                <div className="row pt-2">
                  <div className="col">
                    {" "}
                    <p className="title-filter">Từ ngày</p>
                  </div>
                  <div className="col">
                    <Space direction="vertical">
                      <DatePicker onChange={onChange} format="DD/MM/YYYY" />
                    </Space>
                  </div>
                </div>
                <div className="row pt-2">
                  <div className="col">
                    <p className="title-filter">Đến ngày</p>
                  </div>
                  <div className="col">
                    <Space direction="vertical">
                      <DatePicker onChange={onChange} format="DD/MM/YYYY" />
                    </Space>
                  </div>
                </div>
                <div className="filter-ticket">
                  <button onClick={handleFilterClick}>Lọc</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledTicketComparison>
  );
};

export default TicketComparison;
